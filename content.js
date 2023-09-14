console.log("PL Tools extension is working!");
const table = document.getElementsByClassName("table-striped")[0]
const links = table.getElementsByTagName("a");
var parser = new DOMParser();
for (const a of links) {
    const response = fetch(a.href).then((response) => {
        return response.text();
    }).then((html) => {
        var course_page = parser.parseFromString(html, "text/html");
        assessments = course_page.getElementsByClassName("card mb-4")[0];
        assessments.getElementsByClassName("card-header")[0].innerHTML = a.text;
        document.getElementById("content").append(assessments);
    });
}