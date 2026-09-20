import { beforeEach, describe, expect, it, vi } from "vitest";

const sendNotification = vi.fn();
const subscriptionFind = vi.fn();
const subscriptionFindByIdAndUpdate = vi.fn();
const subscriptionFindOneAndUpdate = vi.fn();
const notificationCreate = vi.fn();
const notificationFindByIdAndUpdate = vi.fn();

vi.mock("web-push", () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification
  }
}));

vi.mock("../src/config/env.js", () => ({
  env: {
    vapidPublicKey: "public-key",
    vapidPrivateKey: "private-key",
    vapidSubject: "mailto:test@example.com"
  }
}));

vi.mock("../src/models/PushSubscription.js", () => ({
  PushSubscription: {
    find: subscriptionFind,
    findByIdAndUpdate: subscriptionFindByIdAndUpdate,
    findOneAndUpdate: subscriptionFindOneAndUpdate
  }
}));

vi.mock("../src/models/NotificationLog.js", () => ({
  NotificationLog: {
    create: notificationCreate,
    findByIdAndUpdate: notificationFindByIdAndUpdate
  }
}));

const pushService = await import("../src/services/pushService.js");
const pushController = await import("../src/controllers/pushController.js");

function resMock() {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.payload = data;
      return this;
    }
  };
}

describe("push subscriptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses endpoint upsert so duplicate subscriptions do not create duplicates", async () => {
    subscriptionFindOneAndUpdate.mockResolvedValue({ enabled: true, unreadCount: 0 });
    const req = {
      body: {
        endpoint: "https://push.example/subscription",
        keys: { p256dh: "p256dh-key-value", auth: "auth-key-value" },
        platform: "MacIntel"
      },
      get: () => "Vitest"
    };
    const res = resMock();

    await pushController.subscribe(req, res);

    expect(subscriptionFindOneAndUpdate).toHaveBeenCalledWith(
      { endpoint: "https://push.example/subscription" },
      expect.objectContaining({ $set: expect.objectContaining({ enabled: true }) }),
      expect.objectContaining({ upsert: true, new: true })
    );
    expect(res.statusCode).toBe(201);
  });

  it("unsubscribe disables the subscription", async () => {
    subscriptionFindOneAndUpdate.mockResolvedValue({});
    const res = resMock();
    await pushController.unsubscribe({ body: { endpoint: "https://push.example/subscription" } }, res);

    expect(subscriptionFindOneAndUpdate).toHaveBeenCalledWith(
      { endpoint: "https://push.example/subscription" },
      expect.objectContaining({ enabled: false, lastSeenAt: expect.any(Date) })
    );
    expect(res.payload).toEqual({ enabled: false });
  });

  it("mark-read clears unread count", async () => {
    subscriptionFindOneAndUpdate.mockResolvedValue({ unreadCount: 0 });
    const res = resMock();
    await pushController.markRead({ body: { endpoint: "https://push.example/subscription" } }, res);

    expect(subscriptionFindOneAndUpdate).toHaveBeenCalledWith(
      { endpoint: "https://push.example/subscription" },
      expect.objectContaining({ unreadCount: 0, lastSeenAt: expect.any(Date) }),
      { new: true }
    );
    expect(res.payload).toEqual({ unreadCount: 0 });
  });
});

describe("push dispatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notificationCreate.mockResolvedValue({ _id: "log-1" });
    subscriptionFind.mockReturnValue({
      lean: vi.fn().mockResolvedValue([
        { _id: "sub-1", endpoint: "https://push.example/1", keys: { p256dh: "a", auth: "b" } }
      ])
    });
    subscriptionFindByIdAndUpdate.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ unreadCount: 1 })
    });
  });

  it("does not send duplicate notification logs", async () => {
    notificationCreate.mockRejectedValue({ code: 11000 });

    const result = await pushService.broadcastPush({ type: "assessment-created", title: "New CT", body: "CE CT", url: "/assessments" }, "event-created:1");

    expect(result).toEqual({ skipped: true, reason: "duplicate" });
    expect(subscriptionFind).not.toHaveBeenCalled();
  });

  it("disables expired 404/410 subscriptions without failing broadcast", async () => {
    sendNotification.mockRejectedValue({ statusCode: 410 });

    const result = await pushService.broadcastPush({ type: "assessment-created", title: "New CT", body: "CE CT", url: "/assessments" }, "event-created:2");

    expect(result.failureCount).toBe(1);
    expect(subscriptionFindByIdAndUpdate).toHaveBeenCalledWith("sub-1", { enabled: false });
  });

  it("push failure does not throw and does not block callers", async () => {
    sendNotification.mockRejectedValue(new Error("network down"));

    await expect(pushService.notifyNewAssessment({
      _id: "event-1",
      type: "ct",
      subjectCode: "CE",
      date: "2026-09-24",
      startTime: "13:30",
      marks: 20
    })).resolves.toMatchObject({ failureCount: 1 });
  });

  it("detects important assessment update fields", () => {
    expect(pushService.importantEventChanged({ marks: 20 }, { marks: 30 })).toBe(true);
    expect(pushService.importantEventChanged({ title: "CE CT" }, { title: "CE CT final" })).toBe(false);
  });
});
