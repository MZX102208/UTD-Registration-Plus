let fade_time = 100;
let calendar_fade_time = 100;
let button_delay = 75;

let classUniqueId;
let classScheduleBlocks = [];

let classInfo;
let courseTitle;
let profName;

$("body").on("click", "#registrationModal", function (event) {
    switch (event.target.id) {
        case "registrationModal":
            close();
            break;
        case "closeModal":
            close();
            break;
        case "rateMyProf":
            redirectToRMP();
            break;
        case "saveCourse":
            saveCourse();
            break;
        case "removeCourse":
            removeCourse();
            break;
    }
});

$("body").on("change", "#semesters", function () {
    populateChart($(this).val());
});

function injectRegistrationModal() {
    // Inject files that will be used in the registration modal
    injectCSS("css/styles.css");
    
    $.get(chrome.extension.getURL("html/registration-modal-template.html"), function (data) {
        $(data).css("display", "none").prependTo("body");
    });
}

function openRegistrationModal(jQueryCourseRowElement) {
    getClassData(jQueryCourseRowElement);

	chrome.runtime.sendMessage({
        command: "checkIfCourseIsSaved",
        classUID: classUniqueId
	}, function (response) {
        if (response.isSaved) setCourseSaveable(false);
        else setCourseSaveable(true);
    });

    $("#courseTitle").html(courseTitle);
    $("#profName").html("with " + profName);
    
    updateModalGradeDist();
    
	$(".modal-content").stop().animate({
		scrollTop: 0
	}, 500);
    $("#registrationModal").fadeIn(fade_time);
}

function saveCourse() {
    let extras = {
        classInfo: classInfo,
        courseTitle: courseTitle,
        profName: profName
    }
    let currentCourse = new Course(classUniqueId, classScheduleBlocks, extras);
	chrome.runtime.sendMessage({
        command: "courseStorage",
        action: "add",
        course: currentCourse
	}, function (response) {
        updateAllTabsRegistrationModalCall(false);
        updateAllTabsCourseTableHighlightsCall();
    });
}

function removeCourse() {
	chrome.runtime.sendMessage({
		command: "courseStorage",
        action: "remove",
        classUID: classUniqueId
	}, function (response) {
        updateAllTabsRegistrationModalCall(true);
        updateAllTabsCourseTableHighlightsCall();
    });
}

function redirectToRMP() {
    let url = `http://www.ratemyprofessors.com/search.jsp?queryBy=teacherName&schoolName=university+of+texas+at+dallas&queryoption=HEADER&query=${profName};&facetSearch=true`;
    setTimeout(function () {
        window.open(url);
    }, button_delay);
}

function close() {
    $("#registrationModal").fadeOut(fade_time);
}

function getClassData(jQueryCourseRowElement) {
    classInfo = getFirstChild(jQueryCourseRowElement.children("td").eq(1), "a").text();
    courseTitle = jQueryCourseRowElement.children("td").eq(2).text().replace(/\(.+\)/, ""); // Remove the "(Credit Hours)" text after the course name
    profName = getFirstChild(jQueryCourseRowElement.children("td").eq(3), "a").text();

    classUniqueId = getClassUID(jQueryCourseRowElement);
    classScheduleBlocks = getScheduleBlocksFromElement(jQueryCourseRowElement);
}

function updateModalGradeDist() {
    getGrades(function (response) {
        populateGradeDistDropdown(Object.keys(response.data));
        populateChart($("#semesters").val());
	});
}

function populateGradeDistDropdown(semesters) {
    if (semesters.length == 0) {
		$("#semesters").append("<option>No Data</option>")
    } else {
		let sems = [];
		for (let i = 0; i < semesters.length; i++) {
			sems.push($(`<option value="${semesters[i]}">${semesters[i]}</option>`));
		}
		$("#semesters").html(sems);
    }
}

function populateChart(selectedSemester) {
    toggleChartLoading(true);
    getGrades(function (response) {
        let gradeDist = response.data[selectedSemester] ? response.data[selectedSemester] : {};
        setChart(gradeDist);
    })
}

function getGrades(responseHandler) {
	chrome.runtime.sendMessage({
		command: "gradesQuery",
        profName: profName,
        classInfo: classInfo
	}, responseHandler);
}

function toggleChartLoading(loading) {
	if (loading) {
		$("#chartload").css("display", "inline-block");
		$("#chart").hide();
	} else {
		$("#chartload").hide();
		$("#chart").show();
	}
}

function setChart(data) {
	// set up the chart
	toggleChartLoading(false);
	Highcharts.chart("chart", buildChartConfig(data), function (chart) { // on complete
		if (Object.keys(data).length == 0) {
			//if no data, then show the message and hide the series
			chart.renderer.text("Could not find data for this Instructor teaching this Course.", 100, 120)
				.css({
					fontSize: "20px",
					width: "300px",
					align: "center",
					left: "160px"
				})
				.add();
			$.each(chart.series, function (i, ser) {
				ser.hide();
			});
		}
	});
}

// Listen for when the user adds or removes a course from their schedule
chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		if (request.command == "updateRegistrationModal") {
			setCourseSaveable(request.isSaveable);
		}
	}
);

function setCourseSaveable(isSaveable) {
    if (isSaveable) {
        $("#saveCourse").show();
        $("#removeCourse").hide();
    } else {
        $("#saveCourse").hide();
        $("#removeCourse").show();
    }
}
