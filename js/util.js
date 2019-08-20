function injectRegistrationModal() {
    // Inject files that will be used in the registration modal
    injectCSS("css/styles.css");
    injectJS("js/registration-modal.js");
    
    $.get(chrome.extension.getURL("html/registration-modal-template.html"), function(data) {
        $(data).css("display", "none").appendTo("body");
    });
}

function setMultipleAttributes(element, attributeList) {
    attributeList.forEach(function (attribute) {
        element.setAttribute(attribute.name, attribute.value)
    });
}

function getFirstChild(jQueryElement, childTagName) {
    return jQueryElement.children(childTagName).eq(0);
}

function getFirstDescendant(jQueryElement, childTagNames) {
    let currentElement = jQueryElement;
    childTagNames.forEach(function(tagName)  {
        currentElement = getFirstChild(currentElement, tagName);
    })
    return currentElement;
}

function appendNewColumn(jQueryElement, columnTagName, newColumnElement) {
    jQueryElement.children(columnTagName).eq(-1).after(newColumnElement);
}

function injectCSS(cssURL) {
    var path = chrome.extension.getURL(cssURL);
    $("head").append($("<link>")
        .attr("rel","stylesheet")
        .attr("type","text/css")
        .attr("href", path));
}

function injectJS(jsURL) {
    var path = chrome.extension.getURL(jsURL);
    $("head").append($("<script>")
        .attr("type","text/javascript")
        .attr("src", path));
}
