// // Set dimensions for the chart
// const width = 800;
// const height = 400;
// const margin = { top: 50, right: 50, bottom: 50, left: 50 };

// // Create an SVG container
// const svg = d3.select("#chart")
//     .append("svg")
//     .attr("width", width + margin.left + margin.right)
//     .attr("height", height + margin.top + margin.bottom)
//     .append("g")
//     .attr("transform", `translate(${margin.left}, ${margin.top})`);

// // Load HR data from a student file
// const student = "S1";  // Change this to load different students
// const exam = "Final";   // Change this to Midterm1, Midterm2, etc.
// const filePath = `data/${student}/${exam}/HR.csv`;

// d3.csv(filePath).then(function(data) {
//     // Convert time and HR values to numbers
//     data.forEach(d => {
//         d.Time = +d.Time; // Convert to numeric time (assuming Time column exists)
//         d.HR = +d.HR;     // Convert HR to number
//     });

//     // Set up scales
//     const xScale = d3.scaleLinear()
//         .domain(d3.extent(data, d => d.Time))
//         .range([0, width]);

//     const yScale = d3.scaleLinear()
//         .domain([d3.min(data, d => d.HR) - 5, d3.max(data, d => d.HR) + 5])
//         .range([height, 0]);

//     // Create line generator
//     const line = d3.line()
//         .x(d => xScale(d.Time))
//         .y(d => yScale(d.HR));

//     // Draw line
//     svg.append("path")
//         .datum(data)
//         .attr("fill", "none")
//         .attr("stroke", "steelblue")
//         .attr("stroke-width", 2)
//         .attr("d", line);

//     // Add X axis
//     svg.append("g")
//         .attr("transform", `translate(0, ${height})`)
//         .call(d3.axisBottom(xScale));

//     // Add Y axis
//     svg.append("g")
//         .call(d3.axisLeft(yScale));

//     // Add labels
//     svg.append("text")
//         .attr("x", width / 2)
//         .attr("y", height + 40)
//         .attr("text-anchor", "middle")
//         .text("Time (seconds)");

//     svg.append("text")
//         .attr("x", -height / 2)
//         .attr("y", -40)
//         .attr("transform", "rotate(-90)")
//         .attr("text-anchor", "middle")
//         .text("Heart Rate (BPM)");

//     svg.append("text")
//         .attr("x", width / 2)
//         .attr("y", -10)
//         .attr("text-anchor", "middle")
//         .attr("font-size", "16px")
//         .attr("font-weight", "bold")
//         .text(`Heart Rate Over Time - ${student} ${exam}`);
// }).catch(function(error) {
//     console.error("Error loading dataset:", error);
// });
