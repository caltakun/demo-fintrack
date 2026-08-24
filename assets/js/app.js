const money=n=>new Intl.NumberFormat("en-PH",{style:"currency",currency:"PHP"}).format(Number(n)||0);
const today=new Date().toISOString().slice(0,10);
let data=JSON.parse(localStorage.getItem("fintrackData")||"null")||{
 income:[
  {id:1,desc:"Monthly Salary",cat:"Salary",date:"2026-08-01",amount:30000},
  {id:2,desc:"Freelance Project",cat:"Freelance",date:"2026-08-08",amount:5000}
 ],
 expense:[
  {id:3,desc:"Electric Bill",cat:"Bills",date:"2026-08-04",amount:1800},
  {id:4,desc:"Groceries",cat:"Food",date:"2026-08-09",amount:2200},
  {id:5,desc:"Transportation",cat:"Transport",date:"2026-08-11",amount:800}
 ],
 goals:[
  {id:1,name:"Emergency Fund",target:100000,current:30000},
  {id:2,name:"New Laptop",target:50000,current:22000},
  {id:3,name:"Travel Fund",target:30000,current:9000}
 ],
 investments:[
  {id:1,name:"MP2 Savings",type:"Government",capital:20000,value:22000},
  {id:2,name:"Index Fund",type:"Mutual Fund",capital:10000,value:11200}
 ],
 protection:[
  {id:1,name:"Emergency Fund",type:"Emergency Fund",amount:30000,status:"Active"},
  {id:2,name:"Life Insurance",type:"Insurance",amount:500000,status:"Active"}
 ]};
function save(){localStorage.setItem("fintrackData",JSON.stringify(data))}
function sum(arr,key="amount"){return arr.reduce((a,x)=>a+Number(x[key]||0),0)}
function render(){
 const inc=sum(data.income),exp=sum(data.expense),sav=sum(data.goals,"current"),inv=sum(data.investments,"value"),prot=sum(data.protection);
 totalIncome.textContent=money(inc);totalExpense.textContent=money(exp);totalSavings.textContent=money(sav);totalInvestments.textContent=money(inv);totalProtection.textContent=money(prot);netPosition.textContent=money(inc-exp);
 reportIncome.textContent=money(inc);reportExpense.textContent=money(exp);reportSavings.textContent=money(sav);
 portfolioValue.textContent=money(inv);portfolioGain.textContent=money(sum(data.investments.map(x=>({amount:Number(x.value)-Number(x.capital)}))));
 coverageTotal.textContent=money(prot); donutTotal.textContent=money(exp);
 renderIncome();renderExpenses();renderRecent();renderGoals();renderInvestments();renderProtection();health();
 updateCharts();
}
function rowActions(id,type){return `<button class="action-btn delete" data-id="${id}" data-type="${type}" title="Delete">×</button>`}
function renderIncome(){incomeTable.innerHTML=data.income.length?data.income.map(x=>`<tr><td><b>${x.desc}</b></td><td><span class="tag">${x.cat}</span></td><td>${x.date}</td><td class="amount-income">+${money(x.amount)}</td><td>${rowActions(x.id,"income")}</td></tr>`).join(""):`<tr><td colspan="5" class="empty">No income records yet.</td></tr>`}
function renderExpenses(){expenseTable.innerHTML=data.expense.length?data.expense.map(x=>`<tr><td><b>${x.desc}</b></td><td><span class="tag">${x.cat}</span></td><td>${x.date}</td><td class="amount-expense">-${money(x.amount)}</td><td>${rowActions(x.id,"expense")}</td></tr>`).join(""):`<tr><td colspan="5" class="empty">No expense records yet.</td></tr>`}
function renderRecent(){let all=[...data.income.map(x=>({...x,type:"income"})),...data.expense.map(x=>({...x,type:"expense"}))].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6);recentTable.innerHTML=all.map(x=>`<tr><td><b>${x.desc}</b></td><td><span class="tag">${x.cat}</span></td><td>${x.date}</td><td class="${x.type==="income"?"amount-income":"amount-expense"}">${x.type==="income"?"+":"-"}${money(x.amount)}</td></tr>`).join("")}
function renderGoals(){let html=data.goals.map(x=>{let p=Math.min(100,x.current/x.target*100);return `<div class="goal"><div class="goal-row"><b>${x.name}</b><span>${money(x.current)} / ${money(x.target)}</span></div><div class="progress"><i style="width:${p}%"></i></div></div>`}).join("");goalList.innerHTML=html;savingsGrid.innerHTML=data.goals.map(x=>{let p=Math.min(100,x.current/x.target*100);return `<div class="goal-card"><div class="goal-icon">▣</div><h3>${x.name}</h3><p>Target savings goal</p><div class="goal-amount"><b>${money(x.current)}</b><span>${p.toFixed(0)}%</span></div><div class="progress"><i style="width:${p}%"></i></div><p style="margin-top:12px;margin-bottom:0">${money(x.target-x.current)} remaining</p><button class="goal-remove delete" data-id="${x.id}" data-type="goals" title="Remove this savings goal">Remove</button></div>`}).join("")}
function renderInvestments(){investmentTable.innerHTML=data.investments.map(x=>{let g=x.value-x.capital;return `<tr><td><b>${x.name}</b></td><td><span class="tag">${x.type}</span></td><td>${money(x.capital)}</td><td>${money(x.value)}</td><td class="${g>=0?"amount-income":"amount-expense"}">${g>=0?"+":""}${money(g)}</td><td>${rowActions(x.id,"investments")}</td></tr>`}).join("")}
function renderProtection(){protectionTable.innerHTML=data.protection.map(x=>`<tr><td><b>${x.name}</b></td><td><span class="tag">${x.type}</span></td><td>${money(x.amount)}</td><td><span class="status">${x.status}</span></td><td>${rowActions(x.id,"protection")}</td></tr>`).join("");protectionBar.style.width=Math.min(100,sum(data.protection)/100000*100)+"%"}
function health(){let i=sum(data.income),e=sum(data.expense),score=i?Math.max(0,Math.min(100,Math.round((1-e/i)*65+(sum(data.goals,"current")>0?20:0)+(sum(data.investments,"value")>0?15:0)))):0;healthScore.textContent=score;healthText.textContent=score>=80?"Excellent financial foundation. Keep your spending controlled and continue investing.":score>=60?"Good progress. Focus on growing savings and keeping expenses within your income.":"Start by tracking every expense and building a consistent emergency fund."}
let cashChart,expenseChart;
function updateCharts(){
 let months=["Mar","Apr","May","Jun","Jul","Aug"],inc=[28000,31000,30000,34000,32000,sum(data.income)],exp=[19000,21000,20500,22000,24000,sum(data.expense)];
 if(cashChart)cashChart.destroy();cashChart=new Chart(document.getElementById("cashFlowChart"),{type:"line",data:{labels:months,datasets:[{label:"Income",data:inc,borderWidth:2,tension:.35},{label:"Spending",data:exp,borderWidth:2,tension:.35}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom",labels:{font:{size:10}}}},scales:{y:{ticks:{callback:v=>"₱"+(v/1000)+"k"},grid:{color:"#eef0f4"}},x:{grid:{display:false}}}}});
 let cats={};data.expense.forEach(x=>cats[x.cat]=(cats[x.cat]||0)+Number(x.amount));let labels=Object.keys(cats);let vals=Object.values(cats);
 if(expenseChart)expenseChart.destroy();expenseChart=new Chart(document.getElementById("expenseChart"),{type:"doughnut",data:{labels:labels.length?labels:["No data"],datasets:[{data:vals.length?vals:[1],borderWidth:0}]},options:{cutout:"73%",plugins:{legend:{display:false}}}});
 const colors=["#635bff","#18a86b","#e5a12e","#ed5c61","#4285e8","#9a6be8"];legend.innerHTML=labels.map((l,i)=>`<span style="--c:${colors[i%colors.length]}">${l} ${money(cats[l])}</span>`).join("");
}
function openModal(type="income"){formType.value=type;modalTitle.textContent=type==="income"?"Add Income":"Add Expense";fCategory.innerHTML=(type==="income"?["Salary","Freelance","Business","Bonus","Other"]:["Food","Bills","Transport","Shopping","Entertainment","Health","Other"]).map(x=>`<option>${x}</option>`).join("");fDate.value=today;fDesc.value="";fAmount.value="";fNotes.value="";modal.classList.remove("hidden")}
function showPage(id){document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));document.getElementById(id).classList.remove("hidden");document.querySelectorAll(".nav-link").forEach(a=>a.classList.toggle("active",a.dataset.page===id));pageTitle.textContent=id[0].toUpperCase()+id.slice(1);if(innerWidth<761)sidebar.classList.remove("open")}
document.querySelectorAll(".nav-link,[data-page]").forEach(a=>a.addEventListener("click",()=>showPage(a.dataset.page)));
quickAdd.onclick=()=>openModal("expense");closeModal.onclick=()=>modal.classList.add("hidden");modal.onclick=e=>{if(e.target===modal)modal.classList.add("hidden")};
document.querySelectorAll(".add-page").forEach(b=>b.onclick=()=>openModal(b.dataset.type));
transactionForm.onsubmit=e=>{e.preventDefault();let type=formType.value;data[type].push({id:Date.now(),desc:fDesc.value,cat:fCategory.value,date:fDate.value,amount:Number(fAmount.value),notes:fNotes.value});save();render();modal.classList.add("hidden")};
document.addEventListener("click",e=>{if(e.target.classList.contains("delete")){let t=e.target.dataset.type,id=Number(e.target.dataset.id);if(t==="goals"&&!confirm("Remove this savings goal?"))return;data[t]=data[t].filter(x=>x.id!==id);save();render()}});
addGoal.onclick=()=>{let name=prompt("Goal name:");if(!name)return;let target=Number(prompt("Target amount:","50000"));if(!target)return;data.goals.push({id:Date.now(),name,target,current:0});save();render()};
addInvestment.onclick=()=>{let name=prompt("Investment name:");if(!name)return;let capital=Number(prompt("Capital:","10000"));let value=Number(prompt("Current value:",capital));data.investments.push({id:Date.now(),name,type:"Investment",capital,value});save();render()};
addProtection.onclick=()=>{let name=prompt("Protection name:");if(!name)return;let amount=Number(prompt("Amount / coverage:","50000"));data.protection.push({id:Date.now(),name,type:"Protection",amount,status:"Active"});save();render()};
menuBtn.onclick=()=>sidebar.classList.toggle("open");themeBtn.onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem("fintrackDark",document.body.classList.contains("dark"))};if(localStorage.getItem("fintrackDark")==="true")document.body.classList.add("dark");
saveSettings.onclick=()=>alert("Settings saved successfully.");
exportBtn.onclick=()=>{let rows=[["Type","Description","Category","Date","Amount"],...data.income.map(x=>["Income",x.desc,x.cat,x.date,x.amount]),...data.expense.map(x=>["Expense",x.desc,x.cat,x.date,x.amount])];let csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");let a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="fintrack-report.csv";a.click()};
render();