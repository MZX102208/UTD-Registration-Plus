let fade_time = 100;
let calendar_fade_time = 100;
let button_delay = 75;

var className;
var courseTitle;
var profName;

function injectRegistrationModal() {
    // Inject files that will be used in the registration modal
    injectCSS("css/styles.css");
    
    $.get(chrome.extension.getURL("html/registration-modal-template.html"), function(data) {
        $(data).css("display", "none").appendTo("body");
    });
}

function openRegistrationModal(jQueryCourseRowElement) {
    className = getFirstChild(jQueryCourseRowElement.children("td").eq(1), "a").text();
    courseTitle = jQueryCourseRowElement.children("td").eq(2).text().replace(/\(.+\)/, ""); // Remove the '(Credit Hours)' text after the course name
    profName = getFirstChild(jQueryCourseRowElement.children("td").eq(3), "a").text();

    $("#courseTitle").html(courseTitle);
    $("#profName").html("with " + profName);
    
    updateModalGradeDist();
    
    $("#registrationModal").fadeIn(fade_time);
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
		var sems = [];
		for (var i = 0; i < semesters.length; i++) {
			sems.push($(`<option value="${semesters[i]}">${semesters[i]}</option>`));
		}
		$("#semesters").append(sems);
    }
}

function populateChart(selectedSemester) {
    toggleChartLoading(true);
    getGrades(function(response) {
        var gradeDist = response.data[selectedSemester] ? response.data[selectedSemester] : {};
        setChart(gradeDist);
    })
}

function getGrades(responseHandler) {
	chrome.runtime.sendMessage({
		command: "gradesQuery",
        profName: profName,
        className: className
	}, responseHandler);
}

function toggleChartLoading(loading) {
	if (loading) {
		$('#chartload').css('display', 'inline-block');
		$("#chart").hide();
	} else {
		$('#chartload').hide();
		$("#chart").show();
	}
}

function setChart(data) {
	// set up the chart
	toggleChartLoading(false);
	Highcharts.chart('chart', buildChartConfig(data), function (chart) { // on complete
		if (Object.keys(data).length == 0) {
			//if no data, then show the message and hide the series
			chart.renderer.text('Could not find data for this Instructor teaching this Course.', 100, 120)
				.css({
					fontSize: '20px',
					width: '300px',
					align: 'center',
					left: '160px'
				})
				.add();
			$.each(chart.series, function (i, ser) {
				ser.hide();
			});
		}
	});
}

$("body").on('click', '#registrationModal', function (event) {
    switch (event.target.id) {
        case "registrationModal":
        case "closeModal":
            close();
            break;
        case "rateMyProf":
            redirectToRMP();
            break;
    }
});

$("body").on('change', '#semesters', function () {
    populateChart($(this).val());
});

function redirectToRMP() {
    var url = `http://www.ratemyprofessors.com/search.jsp?queryBy=teacherName&schoolName=university+of+texas+at+dallas&queryoption=HEADER&query=${profName};&facetSearch=true`;
    setTimeout(function () {
        window.open(url);
    }, button_delay);
}

function close() {
    $("#registrationModal").fadeOut(fade_time);
}
