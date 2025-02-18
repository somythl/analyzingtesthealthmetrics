// Select the submit button and input field
const submitButton = document.getElementById("submitHR");
const restingHRInput = document.getElementById("restingHR");

let restingHR = null;

d3.json("Data/average_hr.json").then(function(data) {
    const tests = ["Midterm 1", "Midterm 2", "Final"];
    const colors = { "Midterm 1": "steelblue", "Midterm 2": "orange", "Final": "green" };


    const width = 500, height = 400;
    const margin = {top: 20, right:100, bottom: 50, left: 70};

    

    // **Clear existing SVG and buttons before appending new ones**
    d3.select("#chart").selectAll("svg").remove();
    d3.select("#buttons").selectAll("button").remove();

    // Create SVG container
    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Initial Y-scale setup based on the data
    const yScaleLine = d3.scaleLinear()
        .domain([d3.min(Object.values(data).flat(), d => d.HR), d3.max(Object.values(data).flat(), d => d.HR)])  // Dynamically set the Y-scale based on the HR data range
        .range([height, 0]);

    // Handle the input submission for resting HR
    submitButton.addEventListener("click", function() {
        const enteredHR = parseFloat(restingHRInput.value);
        
        if (!isNaN(enteredHR)) {
            restingHR = enteredHR;
            drawRestingHRMarker(restingHR);  // Call function to draw the resting heart rate line
        } else {
            alert("Please enter a valid heart rate.");
        }
    });

    // Function to draw the horizontal line for resting HR
    function drawRestingHRMarker(restingHR) {
        // Remove any existing resting heart rate markers
        svg.selectAll(".resting-line").remove();
        svg.selectAll(".heart_line").remove();
        // Ensure the restingHR value is within the Y scale range
        const yPos = yScaleLine(restingHR);
        
        // Draw the horizontal line at the resting heart rate level
        svg.append("line")
            .attr("class", "resting-line")
            .attr("x1", 0)
            .attr("x2", width)  // Draw the line across the entire width of the chart
            .attr("y1", yPos)
            .attr("y2", yPos)
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "4 4") // Dashed line for resting HR
            .attr("opacity", 0.7);

        // Add text to label the resting heart rate line
        svg.append("text")
            .attr("class", "heart_line")
            .attr("x", width - 10)
            .attr("y", yPos - 5)  // Adjust Y position to be slightly above the line
            .attr("text-anchor", "end")
            .attr("fill", "black")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text(`Resting HR: ${restingHR} BPM`);
    }

    // Continue with the rest of your existing chart setup code...

        

    // Tooltip for hover line
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "lightgray")
        .style("padding", "5px")
        .style("border-radius", "5px")
        //.style("display", "none")
        .style("font-size", "14px");

    // Initial X and Y scales
    let xScale = d3.scaleLinear().range([0, width]);
    let yScale = d3.scaleLinear().range([height, 0]);

    // Append axes groups
    const xAxisGroup = svg.append("g").attr("transform", `translate(0,${height})`);
    const yAxisGroup = svg.append("g");

    // X-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Exam Duration (Minutes)");

    // Y-axis label
    svg.append("text")
        .attr("x", -height / 2)
        .attr("y", -50)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Heart Rate (BPM)");

    // Line generator
    const line = d3.line()
        .x(d => xScale(d["Time (s)"] / 60))  // Convert seconds to minutes
        .y(d => yScale(d.HR));
    
    

    // Active tests (start with Midterm 1 selected)
    let activeTests = new Set(["Midterm 1"]);

 


    function updateChart() {
        svg.selectAll(".line").remove();
        svg.selectAll(".end-line").remove();
        svg.selectAll(".end-text").remove();

        if (activeTests.size === 0) return;

        let maxTime = Math.max(...[...activeTests].map(test => 
            d3.max(data[test], d => d["Time (s)"]) / 60
        ));

        xScale.domain([0, maxTime]);
        yScale.domain([
            d3.min(Object.values(data).flat(), d => d.HR),
            d3.max(Object.values(data).flat(), d => d.HR)
        ]);

        xAxisGroup.transition().duration(1000).call(d3.axisBottom(xScale).ticks(10));
        yAxisGroup.transition().duration(1000).call(d3.axisLeft(yScale));

        let endTimes = {}; // Store end times to manage combined labels

        activeTests.forEach(test => {
            const path = svg.append("path")
                .datum(data[test])
                .attr("class", "line")
                .attr("fill", "none")
                .attr("stroke", colors[test])
                .attr("stroke-width", 2)
                .attr("d", line);

            const totalLength = path.node().getTotalLength();
            path
                .attr("stroke-dasharray", totalLength + " " + totalLength)
                .attr("stroke-dashoffset", totalLength)
                .transition()
                .duration(1000)
                .ease(d3.easeLinear)
                .attr("stroke-dashoffset", 0);

            // Store end times
            const endTime = Math.round(d3.max(data[test], d => d["Time (s)"]) / 60); // Round to nearest minute
            if (!endTimes[endTime]) endTimes[endTime] = [];
            endTimes[endTime].push(test);


            


        });

        console.log("End times object:", endTimes); // Shows all end times

        Object.keys(endTimes).forEach(time => {
            const testNames = endTimes[time]; // Tests that end at this time
            console.log(`Processing end time at ${time} min for tests:`, testNames);

            const hasFinal = testNames.includes("Final");
            const hasMidterm = testNames.some(t => t.includes("Midterm"));

            console.log(`At ${time} min -> hasFinal: ${hasFinal}, hasMidterm: ${hasMidterm}`);

            // Ensure we are adding the red dashed line at the correct position
            svg.append("line")
                .attr("class", "end-line")
                .attr("x1", xScale(time))
                .attr("x2", xScale(time))
                .attr("y1", 0)
                .attr("y2", height)
                .attr("stroke", "red")
                .attr("stroke-dasharray", "4 4")
                .attr("stroke-width", 2)
                .attr("opacity", 0.7);

            let labelText = "";

            // ✅ Debug which condition is triggered
            if (hasFinal && !hasMidterm) {
                labelText = "End of Final";  // Only Final selected
            } else if (hasMidterm) {
                labelText = "End of Midterm";  // Any midterm selected
            }

            console.log(`Label assigned at ${time} min: "${labelText}"`);

            if (labelText !== "") {
                const label = svg.append("text")
                    .attr("class", "end-text")
                    .attr("x", xScale(time) + 5)
                    .attr("y", 15)
                    .attr("fill", "red")
                    .style("font-size", "12px");
            
                setTimeout(() => {
                    label.text(labelText);
                    console.log(`Final label assigned at ${time} min:`, labelText);
                }, 100); // Delay to avoid overwriting
            }
            
        });
    } 
        

    function brushed(event) {
        if (!event.selection) return; // Exit if no selection
        isBrushing = true;  // Prevent hover while brushing
    
        const [x0, x1] = event.selection.map(d => xScale.invert(d)); // Convert selection range to minutes
    
        let avgHRs = {}; // Store averages for each test
    
        activeTests.forEach(test => {
            // Filter data within brushed range
            const selectedData = data[test].filter(d => {
                let timeMin = d["Time (s)"] / 60;
                return timeMin >= x0 && timeMin <= x1;
            });
    
            if (selectedData.length > 0) {
                let avgHR = d3.mean(selectedData, d => d.HR);
                avgHRs[test] = avgHR.toFixed(2);
            }
        });
    
        // Ensure event.sourceEvent exists before accessing its properties
        if (event.sourceEvent) {
            let avgText = `Selected Region: ${Math.round(x0)} - ${Math.round(x1)} min<br>`;
            Object.entries(avgHRs).forEach(([test, avg]) => {
                avgText += `${test} Avg HR: ${avg} bpm<br>`;
            });
    
            tooltip.html(avgText)
                .style("left", (event.sourceEvent.pageX + 10) + "px")
                .style("top", (event.sourceEvent.pageY - 20) + "px")
                .style("display", "block");
        }
    }
    

    function brushEnded(event) {
        if (!event.selection) {
            console.log("No selection, allowing hover");
            isBrushing = false; // Allow hover-line to work again
            tooltip.style("display", "none"); // Hide tooltip when not dragging
        } else {
            console.log("Brush selection active");
            isBrushing = true; // Keep the hover disabled while brushing
        }
    }
    

    // Create buttons
    const buttonContainer = d3.select("#buttons");

    tests.forEach(test => {
        const button = buttonContainer.append("button")
            .text(test)
            .style("margin", "5px")
            .style("padding", "5px 10px")
            .style("border", "1px solid black")
            .style("cursor", "pointer")
            .style("background", colors[test])
            .on("click", function() {
                if (activeTests.has(test)) {
                    if (activeTests.size > 1) {
                        activeTests.delete(test);
                        d3.select(this).style("opacity", 0.5);
                    }
                } else {
                    activeTests.add(test);
                    d3.select(this).style("opacity", 1);
                }
                updateChart();
            });

        if (test === "Midterm 1") {
            button.style("opacity", 1);
        } else {
            button.style("opacity", 0.5);
        }
    });
    // Hover line setup
const hoverLine = svg.append("line")
.attr("class", "hover-line")
.attr("stroke", "black")
.attr("stroke-width", 1)
.attr("stroke-dasharray", "4 4")
.style("display", "none"); // Ensure it's hidden initially


// Mouse move handler for hover effect
svg.append("rect")
.attr("width", width)
.attr("height", height)
.style("fill", "none")
.style("pointer-events", "all")
.on("mousemove", function(event) {
    if (isBrushing) return; // Prevent hover while brushing

    const mouseX = d3.pointer(event)[0];
    const hoverTime = xScale.invert(mouseX);  // Convert mouse position to time (in minutes)

    hoverLine
        .style("display", "block")
        .attr("x1", mouseX)
        .attr("x2", mouseX)
        .attr("y1", 0)
        .attr("y2", height);

    let text = `Minute: ${Math.round(hoverTime)}<br>`;

    activeTests.forEach(test => {
        // Find the closest data point for the selected test
        const closestPoint = data[test].reduce((prev, curr) => 
            Math.abs(curr["Time (s)"] / 60 - hoverTime) < Math.abs(prev["Time (s)"] / 60 - hoverTime) ? curr : prev
        );

        // Show HR value for the closest point
        text += `${test}: ${closestPoint.HR.toFixed(2)} bpm<br>`;
    });

    tooltip.html(text)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px")
        .style("display", "block");
})
.on("mouseout", () => {
    hoverLine.style("display", "none");  // Hide hover line on mouse out
    tooltip.style("display", "none");  // Hide tooltip
});

    
    /*
    const hoverLine = svg.append("line")
    .attr("class", "hover-line")
    .attr("stroke", "red")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "4 4")
    .style("display", "none"); // Ensure it's hidden initially

  

    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all")
        /*
        .on("mousemove", function(event) {
            console.log("Triggered");
            if (isBrushing) return; // ✅ Prevent hover ONLY when actively brushing
            const mouseX = d3.pointer(event)[0];
            const hoverTime = xScale.invert(mouseX);

            console.log("Mouse X: ", mouseX, "Hover Time: ", hoverTime);

            hoverLine
                .style("display", "block")
                .attr("x1", mouseX)
                .attr("x2", mouseX)
                .attr("y1", 0)
                .attr("y2", height);

            let text = `Minute: ${Math.round(hoverTime)}<br>`;

            activeTests.forEach(test => {
            // Find the last recorded time for this test
                const maxTestTime = Math.max(...data[test].map(d => d["Time (s)"] / 60));

                if (hoverTime <= maxTestTime) {  // ✅ Ignore tests that have ended
                    const closestPoint = data[test].reduce((prev, curr) => 
                        Math.abs(curr["Time (s)"] / 60 - hoverTime) < Math.abs(prev["Time (s)"] / 60 - hoverTime) ? curr : prev
                    );
                    text += `${test}: ${closestPoint.HR.toFixed(2)} bpm<br>`;
                }
            });

            tooltip.html(text)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px")
                .style("display", "block");
        })
        .on("mouseout", () => {
            if (!isBrushing) { // ✅ Ensure hover resets when brushing is done
            hoverLine.style("display", "none");
            tooltip.style("display", "none");
            }
        }); */ /*
        .on("mousemove", function(event) {
            console.log("Triggered");
            if (isBrushing) return; // Prevent hover during brushing
        
            const mouseX = d3.pointer(event)[0];
            const hoverTime = xScale.invert(mouseX);
        
            hoverLine
                .style("display", "block")
                .attr("x1", mouseX)
                .attr("x2", mouseX)
                .attr("y1", 0)
                .attr("y2", height);
        
            let text = `Minute: ${Math.round(hoverTime)}<br>`;
        
            activeTests.forEach(test => {
                const maxTestTime = Math.max(...data[test].map(d => d["Time (s)"] / 60));
        
                if (hoverTime <= maxTestTime) {  
                    const closestPoint = data[test].reduce((prev, curr) => 
                        Math.abs(curr["Time (s)"] / 60 - hoverTime) < Math.abs(prev["Time (s)"] / 60 - hoverTime) ? curr : prev
                    );
                    text += `${test}: ${closestPoint.HR.toFixed(2)} bpm<br>`;
                }
            });
        
            tooltip.html(text)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px")
                .style("display", "block");
        })
        .on("mouseout", () => {
            if (!isBrushing) {
                hoverLine.style("display", "none");  // Hide hover line when mouseout
                tooltip.style("display", "none");  // Hide tooltip
            }
        });*/
        

    // Define the brush
    const brush = d3.brushX()
    .extent([[0, 0], [width, height]])  // Define brush area
    .on("start", () => isBrushing = true)  // Disable hover while brushing
    .on("brush", brushed)
    .on("end", brushEnded);

    const brushGroup = svg.append("g")
        .attr("class", "brush")
        .call(brush);
    
    brushGroup.style("pointer-events", "none");  // ✅ Prevents brush from blocking hover
    updateChart();

}); 





