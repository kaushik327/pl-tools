console.log("PL Tools extension is working!");
const table = document.getElementsByClassName("table-striped")[0]
const links = table.getElementsByTagName("a");
var parser = new DOMParser();
var page_promises = [];

for (const a of links) {
    const assignments = fetch(a.href).then((response) => {
        return response.text();
    }).then((html) => {
        var course_page = parser.parseFromString(html, "text/html");
        return course_page.getElementsByTagName("tr");
    }).then((rows) => {
        var arr = [];
        for (const row of rows) {
            var th_list = row.getElementsByTagName("th") 
            if (th_list.length > 0) continue;

            var td_list = row.getElementsByTagName("td")
            
            var third_column = td_list[2].innerText.trim();
            if (third_column == "None") continue;

            var badge = td_list[0].getElementsByClassName("badge")[0];
            console.log(badge.innerText);
            badge.innerText = a.innerText.split(":")[0] + "\n" + badge.textContent.trim();

            date_pieces = third_column.split(" until ")[1].split(', ');
            date = Date.parse(date_pieces[2] + " " + date_pieces[0]);

            arr.push([date, row]);
        }
        return arr;
    });
    page_promises.push(assignments);
}

const card = document.createElement("div");
card.className = "card mb-4";
document.getElementById("content").append(card);

const header = document.createElement("div");
header.className = "card-header bg-primary text-white d-flex align-items-center";
header.innerText = "Aggregated Assessments";
card.append(header);

const new_table = document.createElement("table");
new_table.className = "table table-sm table-hover table-striped";
card.append(new_table);

const tbody = document.createElement("tbody");
new_table.append(tbody);

Promise.all(page_promises).then((pages) => {
    sorted_rows = pages.flat();
    sorted_rows.sort();
    for (const info of sorted_rows) {
        tbody.append(info[1]);
    }
})