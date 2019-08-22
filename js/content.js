$(document).ready(function() {
    injectRegistrationModal();
    addRegistrationPlusColumn(); // Try to modify the class tables if the course table is populated when the page first loads
});

// Using a Mutation Observer to detect changes in the site's html
var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.target.className == "rowcount") { // Check if the course table has been modified
            addRegistrationPlusColumn();
        }
        if (mutation.target.id == "registrationModal") {
            updateModalGradeDist();
        }
    })
});
observer.observe(document, { childList: true, subtree: true });

function addRegistrationPlusColumn() {
    // Get the course table
    var courseTable = getFirstChild($(".section-list:first"), "table");
    if (!courseTable) return;

    // Get the elements for the course table
    var tableHeadRow = getFirstDescendant(courseTable, ["thead", "tr"]);
    var tableBodyRows = getFirstChild(courseTable, "tbody").children("tr");

    // Append header column
    var newHeader = document.createElement("th");
    newHeader.setAttribute("width", "60");
    newHeader.innerText = "Plus";
    appendNewColumn(tableHeadRow, "th", newHeader);
    
    // Append body columns
    for (let i = 0; i < tableBodyRows.length; i++) {
        appendNewColumn(tableBodyRows.eq(i), "td", createRegistrationButtonElement(i));

        // Duplicate the onclick attribute to the plus column so the default course menu doesn't open
        var rowOnClick = tableBodyRows.eq(i).attr("onclick");
        tableBodyRows.eq(i).children("td").eq(-1).attr("onclick", rowOnClick);
    }
}

function createRegistrationButtonElement(rowNumber) {
    var element = document.createElement("td");
    element.setAttribute("style", "text-align: center");
    var registrationButton = document.createElement("input");
    setMultipleAttributes(registrationButton, [
        { name: "type", value: "image" },
        { name: "class", value: "distButton" },
        { name: "style", value: "display:inline-block;" },
        { name: "width", value: "30" }, { name: "height", value: "30" }
    ]);
    registrationButton.src = chrome.extension.getURL("images/disticon.png");
    element.appendChild(registrationButton);
    return element;
}

$("body").on('click', '.distButton', function () {
	openRegistrationModal($(this).closest('tr'));
});