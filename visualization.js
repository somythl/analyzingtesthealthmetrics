d3.json("Data/average_hr.json").then(function(data) {
    const tests = ["Midterm 1", "Midterm 2", "Final"];
    const colors = { "Midterm 1": "steelblue", "Midterm 2": "orange", "Final": "green" };

    const width = 800, height = 400;
    const margin = {top: 20, right: 30, bottom: 50, left: 70};

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

    // Tooltip for hover line
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "lightgray")
        .style("padding", "5px")
        .style("border-radius", "5px")
        .style("display", "none")
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
        .text("Minutes");

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

    // Hover line
    const hoverLine = svg.append("line")
        .attr("class", "hover-line")
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4 4")
        .style("display", "none");

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

            // End-of-test indicator
            const endTime = d3.max(data[test], d => d["Time (s)"]) / 60;
            svg.append("line")
                .attr("class", "end-line")
                .attr("x1", xScale(endTime))
                .attr("x2", xScale(endTime))
                .attr("y1", 0)
                .attr("y2", height)
                .attr("stroke", colors[test])
                .attr("stroke-dasharray", "4 4")
                .attr("stroke-width", 2)
                .attr("opacity", 0.7);

            // Add text for end-of-test marker
            svg.append("text")
                .attr("class", "end-text")
                .attr("x", xScale(endTime) + 5)
                .attr("y", 15)
                .attr("fill", colors[test])
                .style("font-size", "12px")
                .text(`End of ${test}`);
        });
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

    // Hover effect with a line
    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mousemove", function(event) {
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
                const closestPoint = data[test].reduce((prev, curr) => 
                    Math.abs(curr["Time (s)"] / 60 - hoverTime) < Math.abs(prev["Time (s)"] / 60 - hoverTime) ? curr : prev
                );
                text += `${test} (BPM): ${closestPoint.HR.toFixed(2)}<br>`;
            });

            tooltip.html(text)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px")
                .style("display", "block");
        })
        .on("mouseout", () => {
            hoverLine.style("display", "none");
            tooltip.style("display", "none");
        });

    updateChart();
});
