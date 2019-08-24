function setMultipleAttributes(element, attributeList) {
    attributeList.forEach(function (attribute) {
        element.setAttribute(attribute.name, attribute.value)
    });
}

function getFirstChild(jQueryElement, childSelector) {
    return jQueryElement.children(childSelector).eq(0);
}

function getFirstDescendant(jQueryElement, childSelectors) {
    let currentElement = jQueryElement;
    childSelectors.forEach(function (tagName)  {
        currentElement = getFirstChild(currentElement, tagName);
    })
    return currentElement;
}

function appendNewColumn(jQueryElement, columnTagName, newColumnElement) {
    jQueryElement.children(columnTagName).eq(-1).after(newColumnElement);
}

function injectCSS(cssURL) {
    let path = chrome.extension.getURL(cssURL);
    $("head").append($("<link>")
        .attr("rel","stylesheet")
        .attr("type","text/css")
        .attr("href", path));
}

function injectJS(jsURL) {
    let path = chrome.extension.getURL(jsURL);
    $("head").append($("<script>")
        .attr("type","text/javascript")
        .attr("src", path));
}

function updateAllTabsRegistrationModalCall(isSaveable) {
    chrome.runtime.sendMessage({
        command: "updateAllTabsRegistrationModal",
        isSaveable: isSaveable
	});
}

function updateAllTabsCourseTableHighlightsCall() {
    chrome.runtime.sendMessage({
        command: "updateAllTabsCourseTableHighlights"
	});
}

function checkUserOption(optionName, executeIfEnabled, executeIfDisabled) {
    chrome.storage.sync.get(optionName, function (data) {
        if (data[optionName]) executeIfEnabled();
        else executeIfDisabled();
    });
}

function buildChartConfig(data) {
    return {
        chart: {
            type: 'column',
            backgroundColor: ' #fefefe',
            spacingLeft: 10
        },
        title: {
            text: null
        },
        subtitle: {
            text: null
        },
        legend: {
            enabled: false
        },
        xAxis: {
            title: {
                text: 'Grades'
            },
            categories: [
                'A+',
                'A',
                'A-',
                'B+',
                'B',
                'B-',
                'C+',
                'C',
                'C-',
                'D+',
                'D',
                'D-',
                'F',
                'W'
            ],
            crosshair: true
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Students'
            }
        },
        credits: {
            enabled: false
        },
        lang: {
            noData: "The professor hasn't taught this class :("
        },
        tooltip: {
            headerFormat: '<span style="font-size:small; font-weight:bold">{point.key}</span><table>',
            pointFormat: '<td style="color:{black};padding:0;font-size:small; font-weight:bold;"><b>{point.y:.0f} Students</b></td>',
            footerFormat: '</table>',
            shared: true,
            useHTML: true
        },
        plotOptions: {
            bar: {
                pointPadding: 0.2,
                borderWidth: 0
            },
            series: {
                animation: {
                    duration: 700
                }
            }
        },
        series: [{
            name: 'Grades',
            data: [{
                y: data["A+"],
                color: '#4CAF50'
            }, {
                y: data["A"],
                color: '#4CAF50'
            }, {
                y: data["A-"],
                color: '#8BC34A'
            }, {
                y: data["B+"],
                color: '#CDDC39'
            }, {
                y: data["B"],
                color: '#FFEB3B'
            }, {
                y: data["B-"],
                color: '#FFC107'
            }, {
                y: data["C+"],
                color: '#FFA000'
            }, {
                y: data["C"],
                color: '#F57C00'
            }, {
                y: data["C-"],
                color: '#FF5722'
            }, {
                y: data["D+"],
                color: '#FF5252'
            }, {
                y: data["D"],
                color: '#E64A19'
            }, {
                y: data["D-"],
                color: '#F44336'
            }, {
                y: data["F"],
                color: '#D32F2F'
            }, {
                y: data["W"],
                color: '#666666'
            }]
        }]
    }
}

/*********************  UTD Specific Utils  ************************/

function getScheduleBlocksFromElement(jQueryCourseRowElement) {
    let scheduleBlocks = [];
    let classScheduleElements = jQueryCourseRowElement.children("td").eq(4).children(".clstbl__resultrow__schedule");
    for (let i = 0; i < classScheduleElements.length; i++) {
        let scheduleElement = classScheduleElements.eq(i);

        let daysToBeScheduled = getFirstChild(scheduleElement, ".clstbl__resultrow__day").text().split(/, | & /);
        let timeScheduled = getFirstChild(scheduleElement, ".clstbl__resultrow__time").text().split(/ - /g);
        let scheduledLocation = getFirstChild(scheduleElement, ".clstbl__resultrow__location").text();
        daysToBeScheduled.forEach(function (day) {
            let timeBlock = new ScheduleBlock(day, timeScheduled[0], timeScheduled[1], scheduledLocation);
            scheduleBlocks.push(timeBlock);
        })
    }
    return scheduleBlocks;
}

function getClassUID(jQueryCourseRowElement) {
    let classInfo = getFirstChild(jQueryCourseRowElement.children("td").eq(1), "a").text(); // Get class info to remove from html text
    return jQueryCourseRowElement.children("td").eq(1).text().replace("\"", "").replace(classInfo, ""); // Isolate the unique class id
}
