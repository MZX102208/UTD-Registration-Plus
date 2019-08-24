var manifestData = chrome.runtime.getManifest();
$("#version").text(manifestData.version);
chrome.storage.sync.get("courseConflictHighlight", function (data) {
	if (data.courseConflictHighlight) {
		off("courseConflictHighlight");
	} else {
		on("courseConflictHighlight");
	}
});

$("#togglecourseConflictHighlight").click(function () {
	var action = $("#togglecourseConflictHighlight").text();
	if (action == "Turn Off") {
		chrome.storage.sync.set({
			courseConflictHighlight: false
		}, function () {
			on("courseConflictHighlight");
		});
	} else {
		chrome.storage.sync.set({
			courseConflictHighlight: true
		}, function () {
			off("courseConflictHighlight");
		});
	}
	updateAllTabsCourseTableHighlightsCall();
});

function on(setting) {
	$("#toggle" + setting).text("Turn On");
	$("#toggle" + setting).css("background", "#4CAF50");
}

function off(setting) {
	$("#toggle" + setting).text("Turn Off");
	$("#toggle" + setting).css("background", "#F44336");
}
