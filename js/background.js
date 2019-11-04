updateBadge(true);
let grades = {};
loadGradesJson();

chrome.storage.onChanged.addListener(function (changes) {
  for (key in changes) {
      if (key === 'savedCourses') {
          updateBadge(false, changes.savedCourses.newValue);
      }
  }
});

chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason == "install") {
      chrome.storage.sync.get("savedCourses", function (data) {
          if (!data.savedCourses) {
              let arr = new Array();
              chrome.storage.sync.set({
                  savedCourses: arr
              }, function () {
                  console.log("initial course list");
              });
              chrome.storage.sync.set({
                  courseConflictHighlight: true
              }, function () {
                  console.log("initial highlighting: true");
              });
              chrome.storage.sync.set({
                  loadAll: true
              }, function () {
                  console.log("initial loadAll: true");
              });
          }
      });
  } else if (details.reason == "update") {
      console.log("updated");
      chrome.storage.sync.get("loadAll", function (data) {
          if (data.loadAll == undefined) {
              chrome.storage.sync.set({
                  loadAll: true
              }, function () {
                  console.log("initial loadAll: true");
              });
          }
      });
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, response) {
  switch (request.command) {
      case "gradesQuery":
        queryGrades(request, response);
        break;
      case "checkIfCourseIsSaved":
        checkIfCourseIsSaved(request, response);
        break;
      case "determineCourseHighlight":
        determineCourseHighlight(request, response);
        break;
      case "getAllConflictingCourses":
        getAllConflictingCourses(response);
        break;
      case "courseStorage":
        if (request.action == "add") saveCourse(request, response);
        if (request.action == "remove") removeCourse(request, response);
        if (request.action == "clear") clearCourseStorage(response);
        break;
      case "updateAllTabsCourseTableHighlights":
        updateAllTabsCourseTableHighlights();
        break;
      case "updateAllTabsRegistrationModal":
        updateAllTabsRegistrationModal();
        break;
      case "updateAllTabsCalendars":
        updateAllTabsCalendars();
        break;
      case "updateBadge":
        updateBadge();
        break;
      default:
        genericHttpRequest(request, response);
        break;
  }
  return true;
});

function checkIfCourseIsSaved(request, response) {
  chrome.storage.sync.get("savedCourses", function (data) {
    let isSaved = !!data.savedCourses.find(function (course) {
      return course.classUID == request.classUID;
    })
    response({
      isSaved: isSaved
    });
  });
}

function determineCourseHighlight(request, response) {
  let currentCourseScheduleBlocks = request.scheduleBlocks;

  chrome.storage.sync.get("savedCourses", function (data) {
    let isSaved = !!data.savedCourses.find(function (course) {
      return course.classUID == request.classUID;
    })
    
    let isConflicting = false;
    data.savedCourses.forEach(function (course) {
      if (isScheduleListConflicting(course.scheduleBlocks, currentCourseScheduleBlocks))
        isConflicting = true;
    });
    response({
      isConflicting: isConflicting,
      isSaved: isSaved
    });
  });
}

function getAllConflictingCourses(response) {
  chrome.storage.sync.get("savedCourses", function (data) {
    let savedCourseList = data.savedCourses;
    let conflictingCourseArr = [];
    for (let i = 0; i < savedCourseList.length; i++) {
      for (let j = i + 1; j < savedCourseList.length; j++) {
        if (isScheduleListConflicting(savedCourseList[i].scheduleBlocks, savedCourseList[j].scheduleBlocks)) {
          conflictingCourseArr.push({ course1: savedCourseList[i], course2: savedCourseList[j] });
        }
      }
    }
    response({
      conflictingCourses: conflictingCourseArr
    });
  });
}

function saveCourse(request, response) {
  chrome.storage.sync.get("savedCourses", function (data) {
    let courses = data.savedCourses;
    courses.push(request.course)
    chrome.storage.sync.set({
      savedCourses: courses
    });
    response({
      success: true
    });
  });
}

function removeCourse(request, response) {
  chrome.storage.sync.get("savedCourses", function (data) {
      let courses = data.savedCourses.filter(function (value, index, arr) {
        return value.classUID != request.classUID;
      });
      chrome.storage.sync.set({
          savedCourses: courses
      });
      response({
        success: true
      });
  });
}

function clearCourseStorage(response) {
  chrome.storage.sync.get("savedCourses", function (data) {
      chrome.storage.sync.set({
          savedCourses: []
      });
      response({
        success: true
      });
  });
}

function updateAllTabsCourseTableHighlights() {
    chrome.tabs.query({}, function (tabs) {
        for (let i = 0; i < tabs.length; i++) {
            chrome.tabs.sendMessage(tabs[i].id, {
                command: "updateCourseTableHighlights"
            });
        }
    });
}

function updateAllTabsRegistrationModal() {
    chrome.tabs.query({}, function (tabs) {
        for (let i = 0; i < tabs.length; i++) {
            chrome.tabs.sendMessage(tabs[i].id, {
                command: "updateRegistrationModal"
            });
        }
    });
}

function updateAllTabsCalendars() {
    chrome.tabs.query({}, function (tabs) {
        for (let i = 0; i < tabs.length; i++) {
            chrome.tabs.sendMessage(tabs[i].id, {
                command: "updateCalendar"
            });
        }
    });
}

function genericHttpRequest(request, response) {
  const xhr = new XMLHttpRequest();
  const method = request.method ? request.method.toUpperCase() : "GET";
  xhr.open(method, request.url, true);
  xhr.onload = () => {
    response(xhr.responseText);
  }
  xhr.onerror = () => response(xhr.statusText);
  if (method == "POST") {
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  }
  xhr.send(request.data);
}

function isScheduleListConflicting(scheduleBlockArr1, scheduleBlockArr2) {
  let isConflicting = false;
  scheduleBlockArr1.forEach(function (scheduleBlock1) {
    scheduleBlockArr2.forEach(function (scheduleBlock2) {
      if (isScheduleBlockIntersecting(scheduleBlock1, scheduleBlock2)) {
        isConflicting = true;
      }
    });
  });
  return isConflicting;
}

/*********************  UTD Specific Code  ************************/

function queryGrades(request, response) {
  let result;
  if (!grades[request.profName] || !grades[request.profName][request.classInfo]) { // Handle the case if there is no data
    result = {}
  } else {
    result = grades[request.profName][request.classInfo];
  }
  response({ data: result });
}

function loadGradesJson() {
  let fileNames = ["fall2017", "spring2018", "summer2018", "fall2018", "spring2019"]
  fileNames.forEach(function (fileName) {
    loadJson("grades/" + fileName + ".json", function (gradeJson) {
      gradeJson.forEach(function (gradeDist) { // Map each grade distribution to a [professor][classInfo][term] group
        let profName = parseProfName(gradeDist.prof);
        let classInfo = gradeDist.subj + " " + gradeDist.num + "." + gradeDist.sect.padStart(3, "0");
        let processedGradeDist = convertStringValuesToNumbers(gradeDist.grades); // Some json files use strings instead of numbers
        if (!grades[profName])  {
          grades[profName] = {};
        }
        if (!grades[profName][classInfo]) {
          grades[profName][classInfo] = {};
          grades[profName][classInfo]["Aggregate"] = {};
        }
        grades[profName][classInfo][gradeDist.term] = processedGradeDist;
        updateGradesAggregate(profName, classInfo, gradeDist.term);
      })
    })
  })
}

function loadJson(path, success) {
  let xhr = new XMLHttpRequest();
  xhr.open("GET", chrome.extension.getURL(path), true);
  xhr.responseType = "arraybuffer";
  xhr.onload = function () {
      let data = new Uint8Array(xhr.response);
      let arr = new Array();
      for (let i = 0; i != data.length; i++) arr[i] = String.fromCharCode(data[i]);
      let jsonString = arr.join("").replace(/\bNaN\b/, "\"No Data\"");
      success(JSON.parse(jsonString));
  };
  xhr.send();
}

function updateGradesAggregate(profName, classInfo, newTermName) {
  let gradeDistMap = grades[profName][classInfo];
  Object.keys(gradeDistMap[newTermName]).forEach(function (key) {
    if (!gradeDistMap["Aggregate"][key]) {
      gradeDistMap["Aggregate"][key] = 0;
    }
    gradeDistMap["Aggregate"][key] += gradeDistMap[newTermName][key];
  })
}

/* 
 * This function will convert the professor"s name format from "(Middle) Last, First"
 * or "Last, First (MiddleInitial)" to "First (Middle) Last"
 */
function parseProfName(profName) {
  profName = profName.replace(/ [A-Z]$/g, ""); // Remove the middle initial if there is one
  let middleAndLastName = profName.substr(0, profName.indexOf(", "));
  let firstName = profName.substr(profName.indexOf(", ") + 2);
  return firstName + " " + middleAndLastName;
}

function convertStringValuesToNumbers(map) {
  Object.keys(map).forEach(function (key) {
    if (typeof map[key] == "string") map[key] = parseInt(map[key], 10);
  });
  return map
}

function updateBadge(first, new_changes) {
  if (new_changes) {
      updateBadgeText(first, new_changes);
  } else {
      chrome.storage.sync.get('savedCourses', function (data) {
          let courses = data.savedCourses;
          updateBadgeText(first, courses);
      });
  }
}

function updateBadgeText(first, courses) {
  let badge_text = (courses && courses.length > 0) ? `${courses.length}` : "";
  let flash_time = !first ? 200 : 0;
  chrome.browserAction.setBadgeText({
      text: badge_text
  });
  if (!first) {
      chrome.browserAction.setBadgeBackgroundColor({
          color: Colors.badge_flash
      });
  }
  setTimeout(function () {
      chrome.browserAction.setBadgeBackgroundColor({
          color: Colors.badge_default
      });
  }, flash_time);
}
