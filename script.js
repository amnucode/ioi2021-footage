const color = [
  'var(--gold)',
  'var(--silver)',
  'var(--bronze)'
];

let problems = [];
let days = [];
let officials = [];
let history = [];
let users = {};
let teams = {};
let scores = {};
let time = 0;
let mode = 0;

const getData = async (url) => {
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

const initData = async () => {
  history = await getData('/data/history.json');
  users = await getData('/data/users.json');
  teams = await getData('/data/teams.json');
  const config = await getData('/data/config.json');
  problems = config.problems;
  days = config.days;
  officials = Object.keys(users).filter(x => !config.unofficials.includes(x));
}

const initElement = () => {
  document.getElementById('control').max = history.length;
  document.getElementById('control').value = history.length;
  let elem = document.getElementById('rank');
  problems.forEach((val, id) => {
    let item = document.createElement('option');
    item.value = (id+3).toString();
    item.text = val;
    elem.options.add(item, null);
  });
}

const initScore = () => {
  Object.keys(users).forEach(userID => {
    users[userID].color = 'white';
    scores[userID] = {};
    problems.forEach(problem => {
      scores[userID][problem] = 0;
    });
  });
  history.forEach(data => {
    data.push(scores[data[0]][data[1]]);
    scores[data[0]][data[1]] = data[3];
    time++;
  });
}

const convertTime = (t) => {
  let start = 0;
  let day = 0;
  days.forEach((val,id) => {
    if (val <= t) {
      start = val;
      day = id+1;
    }
  });
  t -= start;
  const h = Math.floor(t/3600);
  const m = Math.floor(t/60)%60;
  const s = t%60;
  const ret = `DAY ${day} - ${h}:${m}:${s}`;
  return ret;
}

const beautyNumber = (x) => {
  let ret = x.toString();
  const pos = ret.indexOf('.');
  if (pos !== -1) ret = ret.substr(0,pos+3);
  return ret;
}

const getScore = (userID,type) => {
  if (type > 2) return scores[userID][problems[type-3]];
  const day1 = scores[userID][problems[0]]+scores[userID][problems[1]]+scores[userID][problems[2]];
  const day2 = scores[userID][problems[3]]+scores[userID][problems[4]]+scores[userID][problems[5]];
  const global = day1+day2;
  const ret = [global,day1,day2];
  return ret[type];
}

let cutoff = [];
const getColor = (userID) => {
  if (users[userID].color !== 'white') {
    return users[userID].color;
  }
  if (medal) {
    if (getScore(userID,mode) >= getScore(cutoff[0],mode)) {
      return color[0];
    }
    if (getScore(userID,mode) >= getScore(cutoff[1],mode)) {
      return color[1];
    }
    if (getScore(userID,mode) > getScore(cutoff[2],mode)) {
      return color[2];
    }
  }
  return 'white';
}

const render = () => {
  let timeDisp = '';
  switch (time) {
    case 0:
      timeDisp = 'begin';
      break;
    case history.length:
      timeDisp = 'end';
      break;
    default:
      timeDisp = convertTime(history[time-1][2]);
  }
  let rank = officials;
  rank.sort((a,b) => {
    return getScore(b,mode)-getScore(a,mode);
  });
  cutoff = [
    rank[Math.ceil(rank.length/12)-1],
    rank[Math.ceil(rank.length/4)-1],
    rank[Math.floor(rank.length/2)]
  ];
  let table = `
    <tr>
      <th rowspan="2">Rank</th>
      <th rowspan="2">First Name</th>
      <th rowspan="2">Last Name</th>
      <th rowspan="2">Country</th>
      <th colspan="9">Scores</th>
    </tr>
    <tr>
      <th>${problems[0]}</th>
      <th>${problems[1]}</th>
      <th>${problems[2]}</th>
      <th>Day-1</th>
      <th>${problems[3]}</th>
      <th>${problems[4]}</th>
      <th>${problems[5]}</th>
      <th>Day-2</th>
      <th>Global</th>
    </tr>
  `;
  let prevScore = -1;
  let ranking = 0;
  rank.forEach((userID,id) => {
    if (getScore(userID,mode) !== prevScore) ranking = id+1;
    prevScore = getScore(userID,mode);
    table += `
      <tr style="background:${getColor(userID)}" onClick="mark('${userID}')">
        <td>${ranking}</td>
        <td>${users[userID].f_name}</td>
        <td>${users[userID].l_name}</td>
        <td>${teams[users[userID].team].name}</td>
        <td>${beautyNumber(getScore(userID,3))}</td>
        <td>${beautyNumber(getScore(userID,4))}</td>
        <td>${beautyNumber(getScore(userID,5))}</td>
        <td>${beautyNumber(getScore(userID,1))}</td>
        <td>${beautyNumber(getScore(userID,6))}</td>
        <td>${beautyNumber(getScore(userID,7))}</td>
        <td>${beautyNumber(getScore(userID,8))}</td>
        <td>${beautyNumber(getScore(userID,2))}</td>
        <td>${beautyNumber(getScore(userID,0))}</td>
      </tr>
    `;
  });
  document.getElementById('time').innerHTML = timeDisp;
  document.getElementById('scoreboard').innerHTML = table;
}

const mark = (userID) => {
  if (users[userID].color === 'white') {
    users[userID].color = '#'+Math.floor(Math.random()*16777215).toString(16);
  }
  else {
    users[userID].color = 'white';
  }
  render();
}

let medal = true;
const show = () => {
  medal = !medal;
  if (medal) {
    document.getElementById('show').innerHTML = 'Hide Medal';
  }
  else {
    document.getElementById('show').innerHTML = 'Show Medal';
  }
  render();
}

let status = false;
let interval = null;
const play = () => {
  status = !status;
  if (status) {
    if (time === history.length) {
      document.getElementById('control').value = 0;
      change();
    }
    interval = setInterval(forward, 100);
    document.getElementById('play').innerHTML = 'Pause';
  }
  else {
    clearInterval(interval);
    document.getElementById('play').innerHTML = 'Play';
  }
}

const forward = () => {
  if (time < history.length) {
    document.getElementById('control').value = time + 1;
    change();
  }
  else {
    status = false;
    clearInterval(interval);
    document.getElementById('play').style = '';
    document.getElementById('play').innerHTML = 'Play';
  }
}

const change = () => {
  const now = parseInt(document.getElementById('control').value);
  mode = parseInt(document.getElementById('rank').value);
  while (now < time) {
    const data = history[--time];
    scores[data[0]][data[1]] = data[4];
  }
  while (now > time) {
    const data = history[time++];
    scores[data[0]][data[1]] = data[3];
  }
  render();
}

const main = async () => {
  await initData();
  initElement();
  initScore();
  render();
}

main();
