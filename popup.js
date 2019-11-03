let courses = [];

updateCourseList();
updateConflictsList();

$("#clear").click(function () {
  chrome.runtime.sendMessage({
    command: "courseStorage",
    action: "clear"
	}, function (response) {
    updateAllTabsCourseData();
    updateCourseList();
    updateConflictsList();    
	});
})

$("#schedule").click(function () {
	chrome.tabs.create({
		"url": "https://coursebook.utdallas.edu/"
	});
})

$("#calendar").click(function () {
	chrome.tabs.create({
		'url': "html/calendar.html"
	});
});

$("#options_button").click(function () {
	chrome.tabs.create({
		'url': "options.html"
	});
});

function openCourseListInfo(clickedElement) {
  let courseItem = $(clickedElement).parent();
	let more_info = $(courseItem).find('.more-info');
  let arrow = $(courseItem).find(".popup-list-item-arrow");
	if ($(more_info).is(":hidden")) {
		$(more_info).fadeIn(200);
		$(arrow).css('transform', 'rotate(90deg)');
	} else {
		$(more_info).fadeOut(100);
		$(arrow).css('transform', '');
	}
}

function updateCourseList() {
	$("#courseList").empty()
	chrome.storage.sync.get("savedCourses", function (data) {
		courses = data.savedCourses
    checkIfNoCourses();
    
		for (var i = 0; i < courses.length; i++) {
      appendCourseListItem(courses[i]);
		}
	});
}

function updateConflictsList() {
	chrome.runtime.sendMessage({
		command: "getAllConflictingCourses"
	}, function (response) {
    let conflicts = response.conflictingCourses;
    conflicts.forEach(function (conflict) {
      let listItem = document.createElement("p");
      listItem.className = "popup-conflict-list-item";

      let course1Info = conflict.course1.extras.classInfo;
      let course2Info = conflict.course2.extras.classInfo;
      listItem.innerText = "CONFLICT: " + course1Info + " and " + course2Info;

      $(listItem).prependTo("#courseList").hide().fadeIn(200);
    })
	});
}

// TODO: Break this down or find a different way to create the list
function appendCourseListItem(course) {
  $.get(chrome.extension.getURL("html/popup-list-item-template.html"), function (data) {
    let listItem = $(data);
    let classInfo = course.extras.classInfo;
    let profStrings = listToCommaSeperatedString(course.extras.profNames);
    let classUID = course.classUID;
    let classRegistrationStatus = course.extras.classRegistrationStatus;
    
    findFirstDescendant(listItem, ".class-info").text(classInfo);
    if (profStrings.length > 0) findFirstDescendant(listItem, ".prof-names").text("with " + profStrings);
    findFirstDescendant(listItem, ".class-uid").text("(" + classUID + ")");
    findFirstDescendant(listItem, ".main-container").css("background", getStatusColor(classRegistrationStatus));
    findFirstDescendant(listItem, ".more-info").css("display", "none");

    let dropdownItemContainer = findFirstDescendant(listItem, ".popup-list-item-dropdown-item-container");
    if (hasMeetingTimes(course)) {
      findFirstDescendant(dropdownItemContainer, ".popup-sub-list-item-empty").css("display", "none");
      populateSubCourseList(course, dropdownItemContainer);
    }
    
    findFirstDescendant(listItem, ".card").click(function(event) {
      openCourseListInfo(this);
    });
    findFirstDescendant(listItem, "#listRemove").click(function (event) {
      removeCourse(classUID);
    });
    findFirstDescendant(listItem, "#listMoreInfo").click(function (event) {
      moreInfo(course.extras.moreInfoLink);
    });

    listItem.appendTo("#courseList");
  });
}

function populateSubCourseList(course, mainListItem) {
  let locationTimeDayMap = makeLocationTimeDayMap(course.scheduleBlocks);

  Object.keys(locationTimeDayMap).forEach(function (location) {
    let timeDayMap = locationTimeDayMap[location];
    Object.keys(timeDayMap).forEach(function (timeRange) {
      $.get(chrome.extension.getURL("html/popup-sub-list-item-template.html"), function (data) {
        let subListItem = $(data);
        findFirstDescendant(subListItem, ".popup-sub-list-item-times").text(timeRange);
        subListItem.css("background-color", getStatusColor(course.extras.classRegistrationStatus, true));
        let daysString = listToCommaSeperatedString(locationTimeDayMap[location][timeRange]) + ":";
        findFirstDescendant(subListItem, ".popup-sub-list-item-days").text(daysString);
        findFirstDescendant(subListItem, ".popup-sub-list-item-location-content").text(location);

        subListItem.appendTo(mainListItem);
      });
    });
  });
}

function hasMeetingTimes(course) {
  return course.scheduleBlocks.length > 0;
}

function checkIfNoCourses() {
	if (courses.length != 0) {
		$("#empty").hide();
		$("#courseList").show();
	} else {
		showEmpty();
	}
}

function showEmpty() {
	$("#courseList").hide();
	$("#empty").fadeIn(200);
}

function getStatusColor(status, sub = false) {
  let color = "black";
  if (status == "Open") {
      color = sub ? Colors.open_light : Colors.open;
  } else if (status == "Closed") {
      color = sub ? Colors.closed_light : Colors.closed;
  }
  return color;
}

function removeCourse(classUID) {
	chrome.runtime.sendMessage({
		command: "courseStorage",
    action: "remove",
    classUID: classUID
	}, function (response) {
      updateAllTabsCourseData();
      updateCourseList();
      updateConflictsList();
  });
}

function moreInfo(url) {
	chrome.tabs.create({
		"url": url
	});
}
