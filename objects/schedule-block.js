let dayValueArr = { "Sunday": 0,
                    "Monday": 1,
                    "Tuesday": 2,
                    "Wednesday": 3,
                    "Thursday": 4,
                    "Friday": 5,
                    "Saturday": 6 };
let minutesInHour = 60;
let minutesInDay = minutesInHour * 24;

// Schedule Blocks are objects that contain the start and end time for a class and its location
function ScheduleBlock(weekDayStart, timeStart, weekDayEnd, timeEnd, location) {
    this.startTimeInMinutes = dayValueArr[weekDayStart] * minutesInDay + convertHoursToMinutes(timeStart);
    this.endTimeInMinutes = dayValueArr[weekDayEnd] * minutesInDay + convertHoursToMinutes(timeEnd);
    this.location = location;
}

function ScheduleBlock(weekDay, timeStart, timeEnd, location) {
    this.startTimeInMinutes = dayValueArr[weekDay] * minutesInDay + convertHoursToMinutes(timeStart);
    this.endTimeInMinutes = dayValueArr[weekDay] * minutesInDay + convertHoursToMinutes(timeEnd);
    this.location = location;
}

function convertHoursToMinutes(timeInHours) {
    let timeInMinutes = 0;
    if (timeInHours.includes("pm")) timeInMinutes += minutesInDay / 2;
    timeInHours = timeInHours.replace(/(am)|(pm)/, "");

    let numHours = parseInt(timeInHours.substr(0, timeInHours.indexOf(":")));
    timeInMinutes += numHours * minutesInHour;

    let numMinutes = parseInt(timeInHours.replace(/.+:/, ""));
    timeInMinutes += numMinutes;
    return timeInMinutes;
}
