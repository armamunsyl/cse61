const courses = [
  {
    code: "CE",
    name: "Communication Engineering",
    faculty: "Wadia Iqbal Chowdhury",
    email: "wadia@metrouni.edu.bd"
  },
  {
    code: "BC",
    name: "Business Communication",
    faculty: "Rezaul Haque",
    email: "haque@metrouni.edu.bd"
  },
  {
    code: "OS",
    name: "Operating Systems",
    faculty: "Samia Rahman Rima",
    email: "rima@metrouni.edu.bd"
  },
  {
    code: "OS Lab",
    name: "Operating Systems Lab",
    faculty: "Samia Rahman Rima",
    email: "rima@metrouni.edu.bd"
  }
];

export default function CourseInfo() {
  return (
    <section className="rounded-[14px] border border-[#ecd9cc] bg-[#fff8ec] px-3 py-2 shadow-soft">
      <div className="mb-2 flex items-center justify-between gap-3 text-[#402923]">
        <div>
          <h2 className="text-xs font-black tracking-wide sm:text-sm">Course & faculty contacts</h2>
          <p className="mt-0.5 text-[10px] font-bold opacity-65 sm:text-[11px]">CSE 61 D current routine</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        {courses.map((course) => (
          <div key={course.code} className="min-w-0 rounded-lg bg-[#f0dfd1] px-2 py-1.5 text-[#402923] sm:rounded-xl sm:px-3 sm:py-2">
            <div className="min-w-0">
              <div className="text-sm font-black leading-none sm:text-base">{course.code}</div>
              <div className="mt-1 truncate text-[8px] font-bold leading-none opacity-70 sm:text-[10px]">{course.name}</div>
            </div>
            <div className="mt-1 truncate text-[10px] font-black sm:text-xs">{course.faculty}</div>
            <a className="mt-0.5 block truncate text-[9px] font-bold text-[#167a54] underline sm:text-[11px]" href={`mailto:${course.email}`}>
              {course.email}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
