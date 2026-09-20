export const updatedRoutine = [
  ["OS Lab", "OS Lab", "Samia Rahman Rima", "309", 3, "09:00", "10:30", "#c9877d"],
  ["OS Lab", "OS Lab", "Samia Rahman Rima", "309", 3, "10:30", "12:00", "#c9877d"],
  ["Communication Engineering", "CE", "Wadia Iqbal Chowdhury", "505", 3, "12:00", "13:30", "#c9877d"],
  ["Communication Engineering", "CE", "Wadia Iqbal Chowdhury", "503", 0, "13:30", "15:00", "#9a9b82"],
  ["Business Communication", "BC", "Rezaul Haque", "GL1", 1, "13:30", "15:00", "#c7a17e"],
  ["Operating Systems", "OS", "Samia Rahman Rima", "502", 4, "13:30", "15:00", "#d99171"],
  ["Operating Systems", "OS", "Samia Rahman Rima", "508", 1, "16:30", "18:00", "#c7a17e"],
  ["Business Communication", "BC", "Rezaul Haque", "GL1", 4, "16:30", "18:00", "#d99171"]
];

export function routineRowsToDocuments(rows) {
  return rows.map(([subjectName, subjectCode, teacherName, room, weekday, startTime, endTime, color]) => ({
    subjectName,
    subjectCode,
    teacherName,
    room,
    weekday,
    startTime,
    endTime,
    color,
    isActive: true
  }));
}
