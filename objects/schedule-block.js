let dayValueMap = { "Sunday": 0,
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
    this.startTimeInMinutes = dayValueMap[weekDayStart] * minutesInDay + convertHoursToMinutes(timeStart);
    this.endTimeInMinutes = dayValueMap[weekDayEnd] * minutesInDay + convertHoursToMinutes(timeEnd);
    this.location = location;
}

function ScheduleBlock(weekDay, timeStart, timeEnd, location) {
    this.startTimeInMinutes = dayValueMap[weekDay] * minutesInDay + convertHoursToMinutes(timeStart);
    this.endTimeInMinutes = dayValueMap[weekDay] * minutesInDay + convertHoursToMinutes(timeEnd);
    this.location = location;
}

function convertHoursToMinutes(timeInHours) {
    let timeInMinutes = 0;
    if (timeInHours.includes("pm")) timeInMinutes += minutesInDay / 2;
    timeInHours = timeInHours.replace(/(am)|(pm)/, "");

    let numHours = parseInt(timeInHours.substr(0, timeInHours.indexOf(":")));
    timeInMinutes += (numHours % 12) * minutesInHour;

    let numMinutes = parseInt(timeInHours.replace(/.+:/, ""));
    timeInMinutes += numMinutes;
    return timeInMinutes;
}

function convertMinutesToHours(timeInMinutes) {
    timeInMinutes = (timeInMinutes % minutesInDay);

    let hourValue = Math.floor(timeInMinutes / minutesInHour);
    let minuteValue = timeInMinutes % minutesInHour;
    let timeSuffix = "AM";

    if (hourValue >= 12) {
        hourValue -= 12;
        timeSuffix = "PM";
    }
    if (hourValue == 0) hourValue = 12;

    return {
        hours: hourValue,
        minutes: minuteValue,
        timeSuffix: timeSuffix
    }
}

function convertMinutesToHoursStringNoSuffix(timeInMinutes) {
    timeInMinutes = (timeInMinutes % minutesInDay);

    let hourValue = Math.floor(timeInMinutes / minutesInHour);
    let minuteValue = timeInMinutes % minutesInHour;

    return ("0" + hourValue).slice(-2) + ":" + ("0" + minuteValue).slice(-2);
}

function convertMinutesToDay(timeInMinutes) {
    let dayIndex = Math.floor(timeInMinutes / minutesInDay);
    return Object.keys(dayValueMap).find(key => dayValueMap[key] == dayIndex);
}

function convertScheduleBlockToTimeRangeString(scheduleBlock) {
    let startTimeObj = convertMinutesToHours(scheduleBlock.startTimeInMinutes);
    let endTimeObj = convertMinutesToHours(scheduleBlock.endTimeInMinutes);

    let startTimeMinutes = startTimeObj.minutes.toString(10).padStart(2, "0");
    let endTimeMinutes = endTimeObj.minutes.toString(10).padStart(2, "0");

    let startTimeString = startTimeObj.hours + ":" + startTimeMinutes + " " + startTimeObj.timeSuffix;
    let endTimeString = endTimeObj.hours + ":" + endTimeMinutes + " " + endTimeObj.timeSuffix;

    return startTimeString + " to " + endTimeString;
}

function isScheduleBlockIntersecting(scheduleBlock1, scheduleBlock2) {
    return !(scheduleBlock2.endTimeInMinutes < scheduleBlock1.startTimeInMinutes ||
            scheduleBlock2.startTimeInMinutes > scheduleBlock1.endTimeInMinutes);
}
