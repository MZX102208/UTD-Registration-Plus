let fade_time = 100;
let calendar_fade_time = 100;
let button_delay = 75;

function getCourseInfo(courseRowIndex) {
    // Get the elements for the course table
    var tableBodyRows = $(".section-list:first").children("table").eq(0)
                        .children("tbody").eq(0)
                        .children("tr").eq(courseRowIndex);
    
    var courseTitle = tableBodyRows.children("td").eq(2).text().replace(/\(.+\)/, "");
    var profName = tableBodyRows.children("td").eq(3).children("a").eq(0).text();

    $("#courseTitle").html(courseTitle);
    $("#profName").html("with " + profName);
    $("#registrationModal").fadeIn(fade_time);
}

$("#rateMyProf").click(function() {
    var profName = $("#profName").text().replace("with ", "");
    var url = `http://www.ratemyprofessors.com/search.jsp?queryBy=teacherName&schoolName=university+of+texas+at+dallas&queryoption=HEADER&query=${profName};&facetSearch=true`;
	setTimeout(function () {
		window.open(url);
	}, button_delay);
})

$("#registrationModal").click(function(event) {
    if (event.target.id == 'registrationModal') {
        close();
    }
});

$("#closeModal").click(function() {
    close();
});

function close() {
    $("#registrationModal").fadeOut(fade_time);
}
