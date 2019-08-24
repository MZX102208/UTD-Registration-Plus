var grades = {};
loadGradesJson();

chrome.runtime.onInstalled.addListener(function() {
  console.log("onInstalled");
});

chrome.runtime.onMessage.addListener(function (request, sender, response) {
  switch (request.command) {
      case "gradesQuery":
        queryGrades(request, response);
        break;
      default:
        genericHttpRequest(request, response);
        break;
  }
  return true;
});

function queryGrades(request, response) {
  var result;
  if (!grades[request.profName] || !grades[request.profName][request.className]) { // Handle the case if there is no data
    result = {}
  } else {
    result = grades[request.profName][request.className];
  }
  response({ data: result });
}

function genericHttpRequest(request, response) {
  const xhr = new XMLHttpRequest();
  const method = request.method ? request.method.toUpperCase() : "GET";
  xhr.open(method, request.url, true);
  xhr.onload = () => {
    console.log(xhr.responseUrl);
    response(xhr.responseText);
  }
  xhr.onerror = () => response(xhr.statusText);
  if (method == "POST") {
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  }
  xhr.send(request.data);
}

function loadGradesJson() {
  var fileNames = ["fall2017", "spring2018", "summer2018", "fall2018", "spring2019"]
  fileNames.forEach(function(fileName) {
    loadJson("grades/" + fileName + ".json", function(gradeJson) {
      gradeJson.forEach(function(gradeDist) { // Map each grade distribution to a [professor][className][term] group
        var profName = parseProfName(gradeDist.prof);
        var className = gradeDist.subj + " " + gradeDist.num + "." + gradeDist.sect;
        var processedGradeDist = convertStringValuesToNumbers(gradeDist.grades); // Some json files use strings instead of numbers
        if (!grades[profName])  {
          grades[profName] = {};
        }
        if (!grades[profName][className]) {
          grades[profName][className] = {};
          grades[profName][className]["Aggregate"] = {};
        }
        grades[profName][className][gradeDist.term] = processedGradeDist;
        updateGradesAggregate(profName, className, gradeDist.term);
      })
    })
  })
}

function loadJson(path, success) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", chrome.extension.getURL(path), true);
  xhr.responseType = "arraybuffer";
  xhr.onload = function () {
      var data = new Uint8Array(xhr.response);
      var arr = new Array();
      for (var i = 0; i != data.length; i++) arr[i] = String.fromCharCode(data[i]);
      var jsonString = arr.join("").replace(/\bNaN\b/, "\"No Data\"");
      success(JSON.parse(jsonString));
  };
  xhr.send();
}

/* 
 * This function will convert the professor's name format from '(Middle) Last, First'
 * or 'Last, First (MiddleInitial)' to 'First (Middle) Last'
 */
function parseProfName(profName) {
  profName = profName.replace(/ [A-Z]$/g, ""); // Remove the middle initial if there is one
  var middleAndLastName = profName.substr(0, profName.indexOf(", "));
  var firstName = profName.substr(profName.indexOf(", ") + 2);
  return firstName + " " + middleAndLastName;
}

function convertStringValuesToNumbers(map) {
  Object.keys(map).forEach(function(key) {
    if (typeof map[key] == "string") map[key] = parseInt(map[key], 10);
  });
  return map
}

function updateGradesAggregate(profName, className, newTermName) {
  var gradeDistMap = grades[profName][className];
  Object.keys(gradeDistMap[newTermName]).forEach(function(key) {
    if (!gradeDistMap["Aggregate"][key]) {
      gradeDistMap["Aggregate"][key] = 0;
    }
    gradeDistMap["Aggregate"][key] += gradeDistMap[newTermName][key];
  })
}