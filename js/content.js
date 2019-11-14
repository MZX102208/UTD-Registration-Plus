let highlight_conflict = "#F44336";
let highlight_default = "#333333";
let highlight_saved = "#4CAF50";

$(document).ready(function () {
    injectRegistrationModal();
    addRegistrationPlusColumn(); // Try to modify the class tables if the course table is populated when the page first loads
    checkUserOption("courseConflictHighlight", highlightCourseTable, undoCourseTableHighlight);
});

// Using a Mutation Observer to detect changes in the site's html
let observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
        if (mutation.target.className == "search-panel-form-div") { // Check if the course table has been modified
            checkUserOption("courseConflictHighlight", highlightCourseTable, undoCourseTableHighlight);
            addRegistrationPlusColumn();
        }
    })
});
observer.observe(document, { childList: true, subtree: true });

// Listen for when the user adds or removes a course from their schedule
chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		if (request.command == "updateCourseTableHighlights") {
            checkUserOption("courseConflictHighlight", highlightCourseTable, undoCourseTableHighlight);
		}
	}
);

function addRegistrationPlusColumn() {
    // Get the course table
    let courseTable = getFirstChild($(".section-list:first"), "table");
    if (!courseTable) return;

    // Get the elements for the course table
    let tableHeadRow = getFirstDescendant(courseTable, ["thead", "tr"]);
    let tableBodyRows = getFirstChild(courseTable, "tbody").children("tr");

    // Only add the plus column if it hasn't been added yet
    if (tableHeadRow.has('th:contains("Plus")').length) return;

    // Append header column
    let newHeader = document.createElement("th");
    newHeader.setAttribute("width", "60");
    newHeader.innerText = "Plus";
    appendNewColumn(tableHeadRow, "th", newHeader);
    
    // Append body columns
    for (let i = 0; i < tableBodyRows.length; i++) {
        appendNewColumn(tableBodyRows.eq(i), "td", createRegistrationButtonElement());
    }
}

function createRegistrationButtonElement() {
    let element = document.createElement("td");
    element.setAttribute("style", "text-align: center");

    let registrationButton = document.createElement("input");
    setMultipleAttributes(registrationButton, [
        { name: "type", value: "image" },
        { name: "class", value: "distButton" },
        { name: "style", value: "display:inline-block;" },
        { name: "width", value: "30" }, { name: "height", value: "30" }
    ]);
    registrationButton.src = chrome.extension.getURL("images/disticon.png");

    registrationButton.onclick = function (event) {
        event.stopPropagation(); // This is to prevent the default course menu from opening
        openRegistrationModal($(this).closest("tr"));
    };

    element.appendChild(registrationButton);
    return element;
}

function highlightCourseTable() {
    let courseTable = getFirstChild($(".section-list:first"), "table");
    if (!courseTable) return;

    let tableBodyRows = getFirstChild(courseTable, "tbody").children("tr");
    for (let i = 0; i < tableBodyRows.length; i++) {
        let registrationColumn = tableBodyRows.eq(i).children("td").eq(-1);
        let scheduleBlocks = getScheduleBlocksFromElement(tableBodyRows.eq(i));
        let classUID = getClassUID(tableBodyRows.eq(i));

        chrome.runtime.sendMessage({
            command: "determineCourseHighlight",
            classUID: classUID,
            scheduleBlocks: scheduleBlocks
        }, function (response) {
            if (response.isSaved) {
                registrationColumn.css("background-color", highlight_saved);
            } else if (response.isConflicting) {
                registrationColumn.css("background-color", highlight_conflict);
            } else {
                registrationColumn.css("background-color", "");
            }
        });
    }
}

function undoCourseTableHighlight() {
    let courseTable = getFirstChild($(".section-list:first"), "table");
    if (!courseTable) return;

    let tableBodyRows = getFirstChild(courseTable, "tbody").children("tr");
    for (let i = 0; i < tableBodyRows.length; i++) {
        let registrationColumn = tableBodyRows.eq(i).children("td").eq(-1);
        registrationColumn.css("background-color", "");
    }
}
