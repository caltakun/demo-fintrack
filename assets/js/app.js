const defaultSettings={currency:"PHP",budget:30000,displayName:"Carl Justine"};
let settings={...defaultSettings,...(JSON.parse(localStorage.getItem("fintrackSettings")||"null")||{})};
const currencyConfig={PHP:{locale:"en-PH",code:"PHP",symbol:"₱"},USD:{locale:"en-US",code:"USD",symbol:"$"}};
const money=n=>{const c=currencyConfig[settings.currency]||currencyConfig.PHP;return new Intl.NumberFormat(c.locale,{style:"currency",currency:c.code}).format(Number(n)||0)};
const escapeHtml=v=>String(v??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[m]));
const getGreeting=()=>{const h=new Date().getHours();return h<12?"Good morning":h<18?"Good afternoon":"Good evening"};
const initials=name=>String(name||"U").trim().split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0].toUpperCase()).join("")||"U";
const persistSettings=()=>localStorage.setItem("fintrackSettings",JSON.stringify(settings));
const today=new Date().toISOString().slice(0,10);
const protectionOptions=[
 {id:"emergency",label:"Emergency fund",name:"Emergency Fund",type:"Emergency Fund",keywords:["emergency"]},
 {id:"health",label:"Health insurance",name:"Health Insurance",type:"Insurance",keywords:["health insurance","medical insurance","health"]},
 {id:"life",label:"Life insurance",name:"Life Insurance",type:"Insurance",keywords:["life insurance","life"]},
 {id:"income",label:"Income protection",name:"Income Protection",type:"Protection",keywords:["income protection","income"]},
 {id:"other",label:"Others",name:"Other Protection",type:"Other",keywords:[]}
];
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
 updateProfileUI();
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
function goalDetails(goal){
 const target=Math.max(0,Number(goal.target)||0);
 const current=Math.max(0,Number(goal.current)||0);
 const progress=target>0?Math.min(100,(current/target)*100):0;
 const remaining=Math.max(0,target-current);
 const completed=target>0&&current>=target;
 return {target,current,progress,remaining,completed};
}
function goalStatus(goal){return goalDetails(goal).completed?"Completed":"In Progress"}
function goalStatusClass(goal){return goalDetails(goal).completed?"goal-status completed":"goal-status"}
function renderGoals(){
 const dashboardHtml=data.goals.map(x=>{
  const d=goalDetails(x);
  return `<div class="goal"><div class="goal-row"><b>${x.name}</b><span>${money(d.current)} / ${money(d.target)}</span></div><div class="progress"><i style="width:${d.progress}%"></i></div><div class="goal-meta"><span>${d.progress.toFixed(0)}% complete</span><span>${d.completed?"Goal completed":money(d.remaining)+" remaining"}</span></div></div>`;
 }).join("");
 goalList.innerHTML=dashboardHtml||`<div class="empty">No savings goals yet.</div>`;
 savingsGrid.innerHTML=data.goals.map(x=>{
  const d=goalDetails(x);
  return `<div class="goal-card ${d.completed?"goal-completed":""}">
    <div class="goal-card-top"><div class="goal-icon">▣</div><span class="${goalStatusClass(x)}">${goalStatus(x)}</span></div>
    <h3>${x.name}</h3><p>Target savings goal</p>
    <div class="goal-amount"><b>${money(d.current)}</b><span>${d.progress.toFixed(0)}%</span></div>
    <div class="progress"><i style="width:${d.progress}%"></i></div>
    <div class="goal-remaining"><span>${d.completed?"Target reached":"Remaining"}</span><b>${money(d.remaining)}</b></div>
    <div class="goal-actions">
      <button class="goal-action add-savings" data-id="${x.id}">+ Add Savings</button>
      <button class="goal-action withdraw-savings" data-id="${x.id}" ${d.current<=0?"disabled":""}>Withdraw</button>
    </div>
    <button class="goal-remove delete" data-id="${x.id}" data-type="goals" title="Remove this savings goal">Remove Goal</button>
  </div>`;
 }).join("")||`<div class="panel empty">No savings goals yet. Click <b>+ New Goal</b> to create one.</div>`;
}
function renderInvestments(){investmentTable.innerHTML=data.investments.map(x=>{let g=x.value-x.capital;return `<tr><td><b>${x.name}</b></td><td><span class="tag">${x.type}</span></td><td>${money(x.capital)}</td><td>${money(x.value)}</td><td class="${g>=0?"amount-income":"amount-expense"}">${g>=0?"+":""}${money(g)}</td><td>${rowActions(x.id,"investments")}</td></tr>`}).join("")}
function protectionOptionFor(record){
 const text=(String(record.name||"")+" "+String(record.type||"")).toLowerCase().trim();
 for(const option of protectionOptions.slice(0,4)){
  if(option.keywords.some(k=>text.includes(k))) return option;
 }
 return protectionOptions[4];
}
function getProtectionRecord(optionId){
 return data.protection.find(record=>protectionOptionFor(record).id===optionId);
}
function renderProtectionChecklist(){
 const checklist=document.getElementById("protectionChecklist");
 if(!checklist)return;
 checklist.innerHTML=protectionOptions.map(option=>{
  const checked=!!getProtectionRecord(option.id);
  return `<label class="check protection-check"><input type="checkbox" data-protection-option="${option.id}" ${checked?"checked":""}> <span>${option.label}</span></label>`;
 }).join("");
 const count=data.protection.length?protectionOptions.filter(option=>getProtectionRecord(option.id)).length:0;
 const countEl=document.getElementById("protectionChecklistCount");
 if(countEl)countEl.textContent=`${count} / ${protectionOptions.length}`;
}
function renderProtection(){
 const rows=data.protection.map(x=>`<tr><td><b>${x.name}</b></td><td><span class="tag">${x.type}</span></td><td>${money(x.amount)}</td><td><span class="status">${x.status||"Active"}</span></td><td>${rowActions(x.id,"protection")}</td></tr>`).join("");
 protectionTable.innerHTML=rows||`<tr><td colspan="5" class="empty">No protection records yet. Select an item above and click Add Protection.</td></tr>`;
 protectionBar.style.width=Math.min(100,sum(data.protection)/100000*100)+"%";
 renderProtectionChecklist();
}
function health(){let i=sum(data.income),e=sum(data.expense),score=i?Math.max(0,Math.min(100,Math.round((1-e/i)*65+(sum(data.goals,"current")>0?20:0)+(sum(data.investments,"value")>0?15:0)))):0;healthScore.textContent=score;healthText.textContent=score>=80?"Excellent financial foundation. Keep your spending controlled and continue investing.":score>=60?"Good progress. Focus on growing savings and keeping expenses within your income.":"Start by tracking every expense and building a consistent emergency fund."}
let cashChart,expenseChart;
function updateCharts(){
 let months=["Mar","Apr","May","Jun","Jul","Aug"],inc=[28000,31000,30000,34000,32000,sum(data.income)],exp=[19000,21000,20500,22000,24000,sum(data.expense)];
 if(cashChart)cashChart.destroy();cashChart=new Chart(document.getElementById("cashFlowChart"),{type:"line",data:{labels:months,datasets:[{label:"Income",data:inc,borderWidth:2,tension:.35},{label:"Spending",data:exp,borderWidth:2,tension:.35}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom",labels:{font:{size:10}}}},scales:{y:{ticks:{callback:v=>{const c=currencyConfig[settings.currency]||currencyConfig.PHP;return c.symbol+(v/1000)+"k"}},grid:{color:"#eef0f4"}},x:{grid:{display:false}}}}});
 let cats={};data.expense.forEach(x=>cats[x.cat]=(cats[x.cat]||0)+Number(x.amount));let labels=Object.keys(cats);let vals=Object.values(cats);
 if(expenseChart)expenseChart.destroy();expenseChart=new Chart(document.getElementById("expenseChart"),{type:"doughnut",data:{labels:labels.length?labels:["No data"],datasets:[{data:vals.length?vals:[1],borderWidth:0}]},options:{cutout:"73%",plugins:{legend:{display:false}}}});
 const colors=["#635bff","#18a86b","#e5a12e","#ed5c61","#4285e8","#9a6be8"];legend.innerHTML=labels.map((l,i)=>`<span style="--c:${colors[i%colors.length]}">${l} ${money(cats[l])}</span>`).join("");
}
function openModal(type="income"){formType.value=type;modalTitle.textContent=type==="income"?"Add Income":"Add Expense";fCategory.innerHTML=(type==="income"?["Salary","Freelance","Business","Bonus","Other"]:["Food","Bills","Transport","Shopping","Entertainment","Health","Other"]).map(x=>`<option>${x}</option>`).join("");fDate.value=today;fDesc.value="";fAmount.value="";fNotes.value="";modal.classList.remove("hidden")}
function showPage(id){document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));document.getElementById(id).classList.remove("hidden");document.querySelectorAll(".nav-link").forEach(a=>a.classList.toggle("active",a.dataset.page===id));pageTitle.textContent=id[0].toUpperCase()+id.slice(1);if(innerWidth<761)sidebar.classList.remove("open")}
document.querySelectorAll(".nav-link,[data-page]").forEach(a=>a.addEventListener("click",()=>showPage(a.dataset.page)));
quickAdd.onclick=()=>openModal("expense");closeModal.onclick=()=>modal.classList.add("hidden");modal.onclick=e=>{if(e.target===modal)modal.classList.add("hidden")};
document.querySelectorAll(".add-page").forEach(b=>b.onclick=()=>openModal(b.dataset.type));
transactionForm.onsubmit=e=>{e.preventDefault();let type=formType.value;data[type].push({id:Date.now(),desc:fDesc.value,cat:fCategory.value,date:fDate.value,amount:Number(fAmount.value),notes:fNotes.value});save();updateProfileUI();
render();modal.classList.add("hidden")};
document.addEventListener("click",e=>{if(e.target.classList.contains("delete")){let t=e.target.dataset.type,id=Number(e.target.dataset.id);if(t==="goals"&&!confirm("Remove this savings goal?"))return;data[t]=data[t].filter(x=>x.id!==id);save();render()}});
addGoal.onclick=()=>{let name=prompt("Goal name:");if(!name)return;let target=Number(prompt("Target amount:","50000"));if(!Number.isFinite(target)||target<=0)return;data.goals.push({id:Date.now(),name:name.trim(),target,current:0});save();render()};
function openGoalModal(goalId,action){
 const goal=data.goals.find(x=>x.id===Number(goalId));
 if(!goal)return;
 const d=goalDetails(goal);
 document.getElementById("goalId").value=goal.id;
 goalAction.value=action;
 goalAmount.value="";
 goalModalTitle.textContent=action==="add"?"Add Savings":"Withdraw Savings";
 goalModalKicker.textContent=action==="add"?"ADD TO GOAL":"WITHDRAW FROM GOAL";
 goalModalHelp.textContent=action==="add"?`Add money to ${goal.name} and increase its progress.`:`Withdraw money from ${goal.name}. The amount cannot exceed the current saved balance.`;
 goalModalCurrent.textContent=money(d.current);
 goalModalTarget.textContent=money(d.target);
 goalModalRemaining.textContent=money(d.remaining);
 goalSubmit.textContent=action==="add"?"Add Savings":"Withdraw";
 goalPreview.textContent=`New balance: ${money(d.current)}`;
 goalPreview.classList.remove("complete-preview");
 goalModal.classList.remove("hidden");
 setTimeout(()=>goalAmount.focus(),0);
}
function updateGoalPreview(){
 const goal=data.goals.find(x=>x.id===Number(document.getElementById("goalId").value));
 if(!goal)return;
 const amount=Number(goalAmount.value)||0;
 const d=goalDetails(goal);
 let next=goalAction.value==="add"?d.current+amount:d.current-amount;
 next=Math.max(0,next);
 if(goalAction.value==="add")next=Math.min(d.target,next);
 const nextProgress=d.target>0?Math.min(100,next/d.target*100):0;
 goalPreview.textContent=`New balance: ${money(next)} • ${nextProgress.toFixed(0)}% complete`;
 goalPreview.classList.toggle("complete-preview",d.target>0&&next>=d.target);
}
addInvestment.onclick=()=>{let name=prompt("Investment name:");if(!name)return;let capital=Number(prompt("Capital:","10000"));let value=Number(prompt("Current value:",capital));data.investments.push({id:Date.now(),name,type:"Investment",capital,value});save();render()};

addEventListener("click",e=>{
 if(e.target.classList.contains("add-savings"))openGoalModal(e.target.dataset.id,"add");
 if(e.target.classList.contains("withdraw-savings"))openGoalModal(e.target.dataset.id,"withdraw");
});
closeGoalModal.onclick=()=>goalModal.classList.add("hidden");
goalModal.onclick=e=>{if(e.target===goalModal)goalModal.classList.add("hidden")};
goalAmount.addEventListener("input",updateGoalPreview);
goalForm.onsubmit=e=>{
 e.preventDefault();
 const goal=data.goals.find(x=>x.id===Number(document.getElementById("goalId").value));
 if(!goal)return;
 const amount=Number(goalAmount.value);
 if(!Number.isFinite(amount)||amount<=0)return;
 const d=goalDetails(goal);
 if(goalAction.value==="add"){
  goal.current=Math.min(d.target,d.current+amount);
 }else{
  if(amount>d.current){alert(`You can only withdraw up to ${money(d.current)} from this goal.`);return;}
  goal.current=Math.max(0,d.current-amount);
 }
 save();render();goalModal.classList.add("hidden");
};
function openProtectionModal(){
 const selected=protectionOptions.filter(option=>{
  const checkbox=document.querySelector(`[data-protection-option="${option.id}"]`);
  return checkbox&&checkbox.checked;
 });
 if(!selected.length){
  alert("Please select at least one item in the Protection Checklist first.");
  return;
 }
 protectionAmountFields.innerHTML=selected.map(option=>{
  const existing=getProtectionRecord(option.id);
  const value=existing?Number(existing.amount):"";
  return `<div class="protection-amount-row"><div><b>${option.label}</b><small>${existing?"Existing record — update the amount if needed.":"New protection — enter the amount / coverage."}</small></div><input class="protection-amount" data-option-id="${option.id}" type="number" min="0" step="0.01" value="${value}" placeholder="0.00" required></div>`;
 }).join("");
 protectionModal.classList.remove("hidden");
 const first=protectionAmountFields.querySelector("input");
 if(first)first.focus();
}
addProtection.onclick=openProtectionModal;
closeProtectionModal.onclick=()=>protectionModal.classList.add("hidden");
protectionModal.onclick=e=>{if(e.target===protectionModal)protectionModal.classList.add("hidden")};
protectionForm.onsubmit=e=>{
 e.preventDefault();
 const inputs=[...protectionAmountFields.querySelectorAll(".protection-amount")];
 let changed=false;
 inputs.forEach(input=>{
  const amount=Number(input.value);
  if(!Number.isFinite(amount)||amount<0)return;
  const option=protectionOptions.find(x=>x.id===input.dataset.optionId);
  if(!option)return;
  let existing=getProtectionRecord(option.id);
  if(existing){
   existing.amount=amount;
   existing.status="Active";
  }else{
   data.protection.push({id:Date.now()+Math.floor(Math.random()*1000),name:option.name,type:option.type,amount,status:"Active"});
  }
  changed=true;
 });
 if(!changed)return;
 save();render();protectionModal.classList.add("hidden");
};
menuBtn.onclick=()=>sidebar.classList.toggle("open");themeBtn.onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem("fintrackDark",document.body.classList.contains("dark"))};if(localStorage.getItem("fintrackDark")==="true")document.body.classList.add("dark");
function updateProfileUI(){
 const name=(settings.displayName||defaultSettings.displayName).trim()||defaultSettings.displayName;
 const profileName=document.getElementById("profileName"), profileAvatar=document.getElementById("profileAvatar"), greeting=document.getElementById("welcomeGreeting");
 if(profileName)profileName.textContent=name;
 const topProfileName=document.getElementById("topProfileName");
 if(topProfileName)topProfileName.textContent=name;
 if(profileAvatar)profileAvatar.textContent=initials(name);
 if(greeting)greeting.textContent=`${getGreeting()}, ${name} 👋`;
 const currency=document.getElementById("currencySetting"), budget=document.getElementById("budgetSetting"), display=document.getElementById("displayNameSetting"), budgetStatus=document.getElementById("budgetStatus");
 if(currency)currency.value=settings.currency||"PHP";
 if(budget)budget.value=Number(settings.budget)||0;
 if(display)display.value=name;
 if(budgetStatus){const b=Number(settings.budget)||0, spent=sum(data.expense); budgetStatus.textContent=b>0?`This month: ${money(spent)} spent • ${money(Math.max(0,b-spent))} remaining`:`Set a monthly budget to track your remaining amount.`;}
}
function saveSettingsForm(){
 const display=(document.getElementById("displayNameSetting")?.value||"").trim();
 const budget=Number(document.getElementById("budgetSetting")?.value);
 const currency=document.getElementById("currencySetting")?.value;
 if(!display){alert("Please enter a display name.");return;}
 if(!Number.isFinite(budget)||budget<0){alert("Please enter a valid monthly budget.");return;}
 if(!currencyConfig[currency]){alert("Please select a valid currency.");return;}
 settings={...settings,currency,budget,displayName:display};
 persistSettings();
 render();
 alert("Settings saved successfully.");
}
saveSettings.onclick=saveSettingsForm;
exportBtn.onclick=()=>{let rows=[["Type","Description","Category","Date","Amount"],...data.income.map(x=>["Income",x.desc,x.cat,x.date,x.amount]),...data.expense.map(x=>["Expense",x.desc,x.cat,x.date,x.amount])];let csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");let a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="fintrack-report.csv";a.click()};
render();