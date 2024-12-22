import { JSDOM } from "jsdom";

/**
  // for browser console
  let rows = document.querySelectorAll("tr[data-taskid]");
  let tasks = {};

  rows.forEach((row) => {
    const taskId = Number(row.getAttribute("data-taskid"));
    const tds = row.querySelectorAll("td");
    const taskName = tds[1].textContent.trim();
    tasks[taskId] = taskName;
  });
 */

const rows = await scrape();
const tasks = parse(rows);
console.log(tasks);

async function scrape() {
  const res = await fetch(
    "https://oldschool.runescape.wiki/w/Raging_Echoes_League/Tasks"
  );

  const html = await res.text();
  const dom = new JSDOM(html);
  return dom.window.document.querySelectorAll("tr[data-taskid]");
}

function parse(rows: NodeListOf<Element>) {
  const tasks: Record<number, string> = {};

  rows.forEach((row) => {
    const taskId = Number(row.getAttribute("data-taskid"));
    const tds = row.querySelectorAll("td");
    const taskName = tds[1].textContent?.trim();
    // const points = Number(tds[4].textContent?.trim());
    if (!taskName) return;
    tasks[taskId] = taskName;
  });

  return tasks;
}

/**
  <tr data-taskid="436" data-tbz-area-for-filtering="general" class="">
    <td>
      <img
        alt="Globe-icon.png"
        src="/images/Globe-icon.png?3344c"
        decoding="async"
        width="20"
        height="20"
        data-file-width="20"
        data-file-height="20"
      />
    </td>
    <td>25 Easy Clue Scrolls</td>
    <td>Open 25 Reward caskets for completing easy clue scrolls.</td>
    <td class="table-na nohighlight" style="text-align: center">
      <small>N/A</small>
    </td>
    <td data-sort-value="10">
      <img
        alt="Shattered Relics League tasks - Easy.png"
        src="/images/Shattered_Relics_League_tasks_-_Easy.png?86b05"
        decoding="async"
        width="16"
        height="18"
        data-file-width="16"
        data-file-height="18"
      />
      10
    </td>
    <td class="table-bg-orange">0.2%</td>
  </tr>
 */
