console.log("PL Tools extension is working!");
const tables = document.getElementsByClassName("card-header");

var table;
for (const t of tables) {
    if (t.childNodes[0].nodeValue.trim() == 'Courses') {
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
            badge.innerText = a.innerText.split(":")[0] + "\n" + badge.textContent.trim();

            var third_column = td_list[2].innerText.trim();
            date_str = third_column.split(" until ")[1];
            if (date_str === undefined) {
                // date = Infinity
                continue;
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

// Todo table elements
const todo_card = document.createElement("div");
todo_card.className = "card mb-4";
document.getElementById("content").append(todo_card);

const todo_header = document.createElement("div");
todo_header.className = "card-header bg-primary text-white d-flex align-items-center";
todo_header.innerText = "To Do";
todo_card.append(todo_header);

const todo_table = document.createElement("table");
todo_table.className = "table table-sm table-hover table-striped";
todo_card.append(todo_table);

const todo_tbody = document.createElement("tbody");
todo_table.append(todo_tbody);

// Done table elements
const done_card = document.createElement("div");
done_card.className = "card mb-4";
document.getElementById("content").append(done_card);

const done_header = document.createElement("div");
done_header.className = "card-header bg-primary text-white d-flex align-items-center";
done_header.innerText = "Done";
done_card.append(done_header);

const done_table = document.createElement("table");
done_table.className = "table table-sm table-hover table-striped";
done_card.append(done_table);

const done_tbody = document.createElement("tbody");
done_table.append(done_tbody);

const storage_promise = chrome.storage.sync.get({done: []});

Promise.all(page_promises.concat([storage_promise])).then((results) => {
    
    done_assignments = results.pop().done;
    sorted_rows = results.flat();
    sorted_rows.sort();

    for (const info of sorted_rows) {
        let [date, row, label] = info;

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