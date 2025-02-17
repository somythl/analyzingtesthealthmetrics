d3.json("Data/average_hr.json").then(function(data) {
    const tests = ["Midterm 1", "Midterm 2", "Final"];
    const colors = { "Midterm 1": "steelblue", "Midterm 2": "orange", "Final": "green" };

    const width = 800, height = 400;
    const margin = {top: 20, right: 30, bottom: 50, left: 70}; // Increased left margin for Y-axis label

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

    // Initial X and Y scales (placeholders)
    let xScale = d3.scaleLinear().range([0, width]);
    let yScale = d3.scaleLinear().range([height, 0]);

    // Append axes groups
    const xAxisGroup = svg.append("g").attr("transform", `translate(0,${height})`);
    const yAxisGroup = svg.append("g");

    // Add X-axis label
    svg.append("text")
        .attr("class", "x-label")
        .attr("x", width / 2)
        .attr("y", height + 40) // Position below x-axis
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Minutes");

    // Add Y-axis label
    svg.append("text")
        .attr("class", "y-label")
        .attr("x", -height / 2)
        .attr("y", -50) // Position to the left of y-axis
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
        svg.selectAll(".line").remove(); // Remove existing lines

        if (activeTests.size === 0) return; // No active tests, keep chart empty

        // Get max time (in minutes) based on selected tests
        let maxTime = Math.max(...[...activeTests].map(test => 
            d3.max(data[test], d => d["Time (s)"]) / 60
        ));

        // Update X and Y scales
        xScale.domain([0, maxTime]);
        yScale.domain([
            d3.min(Object.values(data).flat(), d => d.HR),
            d3.max(Object.values(data).flat(), d => d.HR)
        ]);

        // Animate X-axis transition
        xAxisGroup.transition().duration(1000).call(d3.axisBottom(xScale).ticks(10));

        // Animate Y-axis transition
        yAxisGroup.transition().duration(1000).call(d3.axisLeft(yScale));

        // Add lines for active tests with animation
        activeTests.forEach(test => {
            const path = svg.append("path")
                .datum(data[test])
                .attr("class", "line")
                .attr("fill", "none")
                .attr("stroke", colors[test])
                .attr("stroke-width", 2)
                .attr("d", line);

            // Animate the line drawing
            const totalLength = path.node().getTotalLength();
            path
                .attr("stroke-dasharray", totalLength + " " + totalLength)
                .attr("stroke-dashoffset", totalLength)
                .transition()
                .duration(1000)
                .ease(d3.easeLinear)
                .attr("stroke-dashoffset", 0);
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
                    if (activeTests.size > 1) { // Ensure at least one test is selected
                        activeTests.delete(test);
                        d3.select(this).style("opacity", 0.5);
                    }
                } else {
                    activeTests.add(test);
                    d3.select(this).style("opacity", 1);
                }
                updateChart();
            });

        // Set initial opacity for Midterm 1 as selected
        if (test === "Midterm 1") {
            button.style("opacity", 1);
        } else {
            button.style("opacity", 0.5);
        }
    });

    updateChart(); // Initialize with Midterm 1 selected
});
