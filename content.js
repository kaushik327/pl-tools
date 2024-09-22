console.log("PL Tools extension is working!");
const tables = document.getElementsByClassName("card-header");

var table;
for (const t of tables) {
    const table_name = t.getElementsByTagName('h2')[0].innerText.trim()
    if (['Courses', 'Courses with student access'].includes(table_name)) {
        table = t.parentElement.getElementsByTagName('table')[0];
        break;
    }
}
if (table === undefined) {
    throw new Error("No courses table");
}

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

            var badge = td_list[0].getElementsByClassName("badge")[0];
            badge.innerText = a.innerText.split(":")[0].trim() + "\n" + badge.textContent.trim();

            var third_column = td_list[2].innerText.trim();
            date_str = third_column.split(" until ")[1];
            if (date_str === undefined) {
                date = Infinity
                // continue;
            } else {
                date_pieces = date_str.split(', ');
                date = Date.parse(date_pieces[2] + " " + date_pieces[0]);
            }
            arr.push([date, row, badge.innerText]);
        }
        return arr;
    });
    page_promises.push(assignments);
}


const content = document.querySelector("div#content");
content.innerHTML += `
  <div class="card mb-4">
    <div class="card-header bg-primary text-white d-flex align-items-center">To Do</div>
    <table class="table table-sm table-hover table-striped">
      <tbody id="todo-tbody"></tbody>
    </table>
  </div>
  <div class="card mb-4">
    <div class="card-header bg-primary text-white d-flex align-items-center">Done</div>
    <table class="table table-sm table-hover table-striped">
      <tbody id="done-tbody"></tbody>
    </table>
  </div>
`;

const todo_tbody = document.getElementById("todo-tbody");
const done_tbody = document.getElementById("done-tbody");

const storage_promise = chrome.storage.sync.get({done: []});

Promise.all([storage_promise, ...page_promises]).then(([storage, ...pages]) => {
    done_assignments = storage.done;
    sorted_rows = pages.flat().sort();

    for (const info of sorted_rows) {
        let [_date, row, label] = info;

        const btn = document.createElement("button");
        btn.className = "btn btn-xs my-0 align-text-bottom btn-outline-primary justify-content-center";
        btn.textContent = "x";
        // btn.src = chrome.runtime.getURL("assets/");
        row.prepend(btn);

        if (done_assignments.includes(label)) {
            done_tbody.append(row);
        } else {
            todo_tbody.append(row);
        }

        btn.addEventListener("click", async () => {
            const idx = done_assignments.indexOf(label);
            if (idx == -1) {
                done_assignments.push(label)
            } else {
                done_assignments.splice(idx, 1);
            }
            await chrome.storage.sync.set({done: done_assignments});
            location.reload();
        })
    }
})
