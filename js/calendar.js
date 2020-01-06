var colorCounter = 0;
var {
    calendar_fade_time,
    button_delay
} = Timing;

var savedCourses = [];
var currCourse = {}

injectModal();

chrome.storage.sync.get("savedCourses", function (data) {
    // Iterate through each saved course and add to 'event'
    savedCourses = data.savedCourses;
    let eventSource = buildEventSource(savedCourses);

    $("#calendar").fullCalendar({
        editable: false, // Don't allow editing of events
        handleWindowResize: true,
        weekends: false, // will hide Saturdays and Sundays
        slotDuration: "00:30:00", // 15 minute intervals on vertical column
        slotEventOverlap: false, // No overlapping between events
        defaultView: "agendaWeek", // Only show week view
        header: false, // Hide buttons/titles
        minTime: "08:00:00", // Start time
        maxTime: "22:00:01", // End time
        columnHeaderFormat: "ddd", // Only show day of the week names
        displayEventTime: true, // Display event time
        allDaySlot: false,
        Duration: {
            hours: 1
        },
        height: 'auto',
        events: eventSource,
        slotLabelFormat: [
            'h:mm A' // lower level of text
        ],
        eventRender: function (event, element, view) {
            $(element).css("padding", "5px").css("margin-bottom", "5px");
        },
        eventClick: function (data, event, view) {
            displayModal(data)
        }
    });
});

function injectModal() {
    $.get(chrome.extension.getURL("html/calendar-modal.html"), function (data) {
        $("#calendar").after($(data).css("display", "none"));
    });
}

function displayModal(data) {
    $("#modal").fadeIn(calendar_fade_time);
    $("#colorStrip").css('background-color', data.color);
    currCourse = savedCourses[data.index];
    setUpModal();
}

function setUpModal() {
    let courseName = currCourse.extras.classInfo;
    let profName = listToCommaSeperatedString(currCourse.extras.profNames);
    let uniqueID = currCourse.classUID;
    let scheduleBlocks = currCourse.scheduleBlocks;
    $("#classname").html(`${courseName} <span style='font-size:small'>(${uniqueID})</span>`);
    buildTimeTitle(scheduleBlocks);
    if (profName.length > 0) $("#prof").html(`with <span style='font-weight:bold;'>${profName}</span>`);
}

function setRegisterButton(status, registerlink) {
    if (canNotRegister(status, registerlink))
        $("#register").text("Can't Register").css("background-color", Colors.closed);
    else if (status.includes("waitlisted"))
        $("#register").text("Join Waitlist").css("background-color", Colors.waitlisted);
    else
        $("#register").text("Register").css("background-color", Colors.open);
}

function buildTimeTitle(datetimearr) {
    $('#timelines').remove();
    var arr = convertScheduleBlockArrToLine(datetimearr)
    var output = "";
    for (let i = 0; i < arr.length; i++) {
        let line = arr[i];
        output += makeLine(line);
    }
    $("#header").after(`<div id='timelines'>${output}</div`);
}

/***** TEMPORARY FUNCTION, REPLACE LATER *****/
function convertScheduleBlockArrToLine(scheduleBlocks) {
    let locationTimeDayMap = makeLocationTimeDayMap(scheduleBlocks);
    let lineObjArr = [];
  
    Object.keys(locationTimeDayMap).forEach(function (location) {
      let timeDayMap = locationTimeDayMap[location];
      Object.keys(timeDayMap).forEach(function (timeRange) {
        let daysString = listToCommaSeperatedString(locationTimeDayMap[location][timeRange]);
          
        let lineObj = {
            days: daysString,
            timeRange: timeRange,
            location: location
        }
        lineObjArr.push(lineObj);
      });
    });
    return lineObjArr;
}


/***** TEMPORARY FUNCTION, REPLACE LATER *****/
function makeLine(line) {
    let {
        days,
        timeRange,
        location
    } = line;
    return `<p class='time' style='font-size:large;'>
                <span style='display:inline-block;'>${days}:</span>
                <span style='margin-left:10px;display:inline-block;text-align:center;'>${timeRange}</span>
                <span style='float:right;display:inline-block;text-align:right;width: 25%;'>
                    <a target='_blank' style='color:#3c87a3;text-decoration:none;'>${location}</a>
                </span>
            </p>`
}


// Iterate through each saved course and add to 'event'
function buildEventSource(savedCourses) {
    colorCounter = 0;
    let event_source = [];
    let hours = 0;
    let courseCount = 0;
    for (let i = 0; i < savedCourses.length; i++) {
        let classInfo = savedCourses[i].extras.classInfo;
        let scheduleBlocks = savedCourses[i].scheduleBlocks;

        let {
            number,
            section
        } = seperateCourseNameParts(classInfo);
        if (section != "701") { // section 701 is an exam section, and does not count as credit hours
            hours += parseInt(number.charAt(1));
            courseCount++;
        }
        for (let j = 0; j < scheduleBlocks.length; j++) {
            let session = scheduleBlocks[j]; // One single session for a class
            let event_obj = setEventForSection(session, colorCounter, i);
            event_source.push(event_obj);
        }
        colorCounter++;
    }
    displayMetaData(hours, courseCount);
    return event_source;
}

function displayMetaData(hours, courseCount) {
    $("#hours").text(hours + " Hours");
    $("#num").text(courseCount + " Courses");
}

//create the event object for every section
function setEventForSection(session, colorCounter, i) {
    let fullDay = convertMinutesToDay(session.startTimeInMinutes);
    let course = savedCourses[i];
    let coursename = course.extras.classInfo;
    let profname = listToCommaSeperatedString(course.extras.profNames);
    profname = profname.length > 0 ? "with " + profname : "";
    let {
        department,
        number,
        section
    } = seperateCourseNameParts(coursename);
    let begDay = calculateBeginningDate(fullDay);
    let startDate = formatCalculateDate(begDay, fullDay, convertMinutesToHoursStringNoSuffix(session.startTimeInMinutes));
    let endDate = formatCalculateDate(begDay, fullDay, convertMinutesToHoursStringNoSuffix(session.endTimeInMinutes));

    event_obj = {
        title: `${department}-${number}.${section} ${profname}`,
        start: startDate,
        end: endDate,
        color: Colors.material_colors[colorCounter],
        building: session.location,
        index: i,
        allday: false
    };
    return event_obj;
}

function formatCalculateDate(begDay, fullDay, specificTime) {
    return begDay + moment().day(fullDay)._d.toString().split(" ")[2] + "T" + specificTime + ":00";
}

function calculateBeginningDate(fullDay) {
    var year = moment().day(fullDay)._d.toString().split(" ")[3];
    var month_num = moment(moment().day(fullDay)._d.toString().split(" ")[1], "MMM").format('MM');
    return `${year}-${month_num}-`;
}

function updateCalendar() {
    chrome.storage.sync.get("savedCourses", function (data) {
        savedCourses = data.savedCourses
        let event_source = buildEventSource(savedCourses);
        $('#calendar').fullCalendar('removeEventSources');
        $("#calendar").fullCalendar('addEventSource', event_source, true);
    });
}

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.command == "updateCalendar") {
            updateCalendar();
        }
    }
);

$("#info").click(() => {
    setTimeout(() => {
        window.open(currCourse.link);
    }, button_delay);
});


$("#save").click(() => {
    takePicture();
});


$("#clear").click(() => {
    /*Clear the list and the storage of courses*/
    chrome.storage.sync.set({
        savedCourses: []
    });
    updateAllTabsCourseData();
    updateCalendar();
});

/*$("#register").click(function () {
    let {
        registerlink,
        status
    } = currCourse;
    if (!canNotRegister(status, registerlink)) {
        setTimeout(() => {
            window.open(registerlink);
        }, button_delay);
    }
});*/

/*$("#export").click(function () {
    var cal = ics();
    var calendarEvents = $('#calendar').fullCalendar('clientEvents');
    for (i in calendarEvents) {
        var event = calendarEvents[i];
        buildICSFile(cal, event);
    }
    cal.download("My_Course_Calendar");
});*/


function buildICSFile(cal, event) {
    let {
        title,
        start,
        end,
        building
    } = event;
    let class_name = title.split('with')[0];
    let description = title.split('with').length > 1 ? `with ${title.split('with')[1]}` : "";
    let time = start._d.toUTCString();
    cal.addEvent(class_name, description, building, start._i, end._i, {
        rrule: `RRULE:FREQ=WEEKLY;BYDAY=${time.substring(0, time.indexOf(",") - 1).toUpperCase()};INTERVAL=1`
    });
}

function takePicture() {
    var width = $("#calendar").width();
    var height = $("#calendar").height();
    let cropper = document.createElement('canvas').getContext('2d');
    html2canvas(document.querySelector("#calendar"), Export.png_options).then(c => {
        cropper.canvas.width = width;
        cropper.canvas.height = height;
        cropper.drawImage(c, 0, 0);
        var a = document.createElement('a');
        a.href = cropper.canvas.toDataURL("image/png");
        a.download = 'mySchedule.png';
        a.click();
    });
}

/*Close Modal when hit escape*/
$(document).keydown((e) => {
    if (e.keyCode == 27) {
        $("#modal").fadeOut(calendar_fade_time);
    }
});

$("body").on("click", "#modal", function (event) {
    switch (event.target.id) {
        case "close":
            close();
            break;
        case "modal":
            close();
            break;
        case "remove":
            removeCourse();
            break;
        case "info":
            moreInfo();
            break;
    }
});

function close() {
    $("#modal").fadeOut(calendar_fade_time);
}

function removeCourse() {
    setTimeout(() => {
        chrome.runtime.sendMessage({
            command: "courseStorage",
            action: "remove",
            classUID: currCourse.classUID
        }, function () {
            $("#modal").fadeOut(calendar_fade_time);
            updateCalendar();
            updateAllTabsCourseData();
        });
    }, button_delay);
}
function moreInfo() {
	chrome.tabs.create({
		"url": currCourse.extras.moreInfoLink
	});
}
