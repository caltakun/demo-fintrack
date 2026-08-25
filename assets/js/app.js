const AUTH_EMAIL="admin@fintrack.local";
const AUTH_USERNAME="admin";
const AUTH_PASSWORD="admin1";
const SESSION_TIMEOUT_MS=30*60*1000;
const MAX_LOGIN_ATTEMPTS=5;
const LOGIN_LOCK_MS=5*60*1000;
const LOGIN_ATTEMPTS_KEY="fintrackLoginAttempts";
const LAST_ACTIVITY_KEY="fintrackLastActivity";
const AUTH_KEY="fintrackAuthenticated";
const CURRENT_USER_KEY="fintrackCurrentUser";
const USERS_KEY="fintrackUsers";
const normalizeEmail=email=>String(email||"").trim().toLowerCase();
const getUsers=()=>{
 const stored=JSON.parse(localStorage.getItem(USERS_KEY)||"null");
 let users=Array.isArray(stored)?stored:[];
 users=users.map(x=>{
   const email=x.email?normalizeEmail(x.email):normalizeEmail(x.username||"");
   return {...x,email,role:x.role||"user"};
 });
 const adminIndex=users.findIndex(x=>normalizeEmail(x.email)===AUTH_EMAIL||String(x.username||"").toLowerCase()===AUTH_USERNAME);
 if(adminIndex<0)users.unshift({email:AUTH_EMAIL,username:AUTH_USERNAME,password:AUTH_PASSWORD,displayName:"FinTrack Admin",role:"admin",demo:true,createdAt:new Date().toISOString()});
 else {
   const existing=users[adminIndex];
   users[adminIndex]={...existing,email:AUTH_EMAIL,username:AUTH_USERNAME,role:"admin",displayName:existing.displayName||"FinTrack Admin"};
   if(existing.password==="fintrack123"||!existing.password)users[adminIndex].password=AUTH_PASSWORD;
 }
 return users;
};
const saveUsers=users=>localStorage.setItem(USERS_KEY,JSON.stringify(users));
if(!localStorage.getItem(USERS_KEY))saveUsers(getUsers());
const authIsActive=()=>{
 const active=localStorage.getItem(AUTH_KEY)==="true"||sessionStorage.getItem(AUTH_KEY)==="true";
 if(!active)return false;
 const last=Number(localStorage.getItem(LAST_ACTIVITY_KEY)||localStorage.getItem("fintrackAuthAt")||0);
 if(last&&Date.now()-last>SESSION_TIMEOUT_MS){clearAuthenticated();return false;}
 return true;
};
function setAuthenticated(remember){(remember?localStorage:sessionStorage).setItem(AUTH_KEY,"true");(remember?sessionStorage:localStorage).removeItem(AUTH_KEY);const now=String(Date.now());localStorage.setItem("fintrackAuthAt",now);localStorage.setItem(LAST_ACTIVITY_KEY,now);}
function touchActivity(){if(authIsActive())localStorage.setItem(LAST_ACTIVITY_KEY,String(Date.now()));}
function clearAuthenticated(){localStorage.removeItem(AUTH_KEY);sessionStorage.removeItem(AUTH_KEY);localStorage.removeItem("fintrackAuthAt");localStorage.removeItem(LAST_ACTIVITY_KEY);}
const showApp=()=>{const screen=document.getElementById("loginScreen"),app=document.querySelector(".app");if(screen)screen.classList.add("hidden");if(app)app.classList.remove("auth-locked")};
const showLogin=()=>{const screen=document.getElementById("loginScreen"),app=document.querySelector(".app");if(screen)screen.classList.remove("hidden");if(app)app.classList.add("auth-locked")};
const defaultSettings={currency:"PHP",budget:30000,displayName:"Carl Justine"};
const currencyConfig={PHP:{locale:"en-PH",code:"PHP",symbol:"₱"},USD:{locale:"en-US",code:"USD",symbol:"$"}};
const emptyData=()=>({income:[],expense:[],goals:[],investments:[],protection:[],accounts:[],debts:[],recurring:[],audit:[]});
const userSlug=u=>normalizeEmail(u||AUTH_EMAIL).replace(/[^a-z0-9._-]/g,"_");
const activeEmail=()=>localStorage.getItem(CURRENT_USER_KEY)||sessionStorage.getItem(CURRENT_USER_KEY)||AUTH_EMAIL;
const getActiveUser=()=>getUsers().find(x=>normalizeEmail(x.email)===normalizeEmail(activeEmail()))||null;
const isAdmin=()=>getActiveUser()?.role==="admin"||normalizeEmail(activeEmail())===AUTH_EMAIL;
const removeUserData=(email)=>{const slug=userSlug(email);localStorage.removeItem(`fintrackData:${slug}`);localStorage.removeItem(`fintrackSettings:${slug}`);};
const getUserData=(email)=>{const slug=userSlug(email);let stored=null;try{stored=JSON.parse(localStorage.getItem(`fintrackData:${slug}`)||"null");}catch{stored=null;}if(stored&&typeof stored==="object")return {...emptyData(),...stored};if(normalizeEmail(email)===AUTH_EMAIL)return createInitialAdminData();return emptyData();};
const migrateCurrentIdentity=()=>{const current=localStorage.getItem(CURRENT_USER_KEY)||sessionStorage.getItem(CURRENT_USER_KEY);if(!current)return;const user=getUsers().find(x=>normalizeEmail(x.email)===normalizeEmail(current)||String(x.username||"").toLowerCase()===String(current).toLowerCase());if(user?.email){localStorage.setItem(CURRENT_USER_KEY,user.email);sessionStorage.removeItem(CURRENT_USER_KEY);}};
migrateCurrentIdentity();
const scopedKey=(base,u=activeEmail())=>`${base}:${userSlug(u)}`;
let settings={...defaultSettings};
let data=emptyData();
const money=n=>{const c=currencyConfig[settings.currency]||currencyConfig.PHP;return new Intl.NumberFormat(c.locale,{style:"currency",currency:c.code}).format(Number(n)||0)};
const escapeHtml=v=>String(v??"").replace(/[&<>\"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[m]));
const getGreeting=()=>{const h=new Date().getHours();return h<12?"Good morning":h<18?"Good afternoon":"Good evening"};
const initials=name=>String(name||"U").trim().split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0].toUpperCase()).join("")||"U";
const today=new Date().toISOString().slice(0,10);
const protectionOptions=[
 {id:"emergency",label:"Emergency fund",name:"Emergency Fund",type:"Emergency Fund",keywords:["emergency"]},
 {id:"health",label:"Health insurance",name:"Health Insurance",type:"Insurance",keywords:["health insurance","medical insurance","health"]},
 {id:"life",label:"Life insurance",name:"Life Insurance",type:"Insurance",keywords:["life insurance","life"]},
 {id:"income",label:"Income protection",name:"Income Protection",type:"Protection",keywords:["income protection","income"]},
 {id:"other",label:"Others",name:"Other Protection",type:"Other",keywords:[]}
];

function audit(action,details){if(!data.audit)data.audit=[];data.audit.unshift({id:Date.now()+Math.random(),at:new Date().toISOString(),action,details});data.audit=data.audit.slice(0,100);}
function save(){localStorage.setItem(scopedKey("fintrackData"),JSON.stringify(data))}
const persistSettings=()=>localStorage.setItem(scopedKey("fintrackSettings"),JSON.stringify(settings));
const adminLegacyData=()=>JSON.parse(localStorage.getItem("fintrackData")||"null");
const adminLegacySettings=()=>JSON.parse(localStorage.getItem("fintrackSettings")||"null");
function createInitialAdminData(){const legacy=adminLegacyData();if(legacy)return legacy;return JSON.parse(localStorage.getItem("fintrackData")||"null")||{
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
 ]};}
function loadUserState(username){
 const u=userSlug(username);
 let storedData=JSON.parse(localStorage.getItem(`fintrackData:${u}`)||"null");
 let storedSettings=JSON.parse(localStorage.getItem(`fintrackSettings:${u}`)||"null");
 if(u===userSlug(AUTH_EMAIL)){
   if(!storedData)storedData=JSON.parse(localStorage.getItem("fintrackData:admin")||"null")||adminLegacyData();
   if(!storedSettings)storedSettings=JSON.parse(localStorage.getItem("fintrackSettings:admin")||"null")||adminLegacySettings();
 }
 if(storedData){data=storedData;save();}else if(u===userSlug(AUTH_EMAIL)){data=createInitialAdminData();save();}else data=emptyData();
 if(storedSettings){settings={...defaultSettings,...storedSettings};persistSettings();}
 else {const user=getUsers().find(x=>normalizeEmail(x.email)===normalizeEmail(String(username)));settings={...defaultSettings,displayName:user?.displayName||defaultSettings.displayName};persistSettings();}
}
function updateStoredUserProfile(name){const u=activeEmail();const users=getUsers();const idx=users.findIndex(x=>normalizeEmail(x.email)===normalizeEmail(u));if(idx>=0){users[idx].displayName=name;saveUsers(users)}}
loadUserState(activeEmail());
function sum(arr,key="amount"){
 const values=Array.isArray(arr)?arr:[];
 return values.reduce((a,x)=>{
   // Cash-flow summaries pass numeric series, while financial records are objects.
   // Support both so summary cards always match the chart data.
   const value=(typeof x==="number"||typeof x==="string")?x:x?.[key];
   return a+Number(value||0);
 },0)
}
function render(){
 const inc=sum(data.income),exp=sum(data.expense),sav=sum(data.goals,"current"),inv=sum(data.investments,"value"),prot=sum(data.protection),acct=sum(data.accounts||[],"balance"),debt=sum(data.debts||[],"balance");
 totalIncome.textContent=money(inc);totalExpense.textContent=money(exp);totalSavings.textContent=money(sav);totalInvestments.textContent=money(inv);totalProtection.textContent=money(prot);netPosition.textContent=money(inc-exp);
 updateProfileUI();
 const nw=document.getElementById("netWorth");if(nw)nw.textContent=money(acct+inv+sav-debt);
 renderAccounts();renderDebts();renderRecurring();renderAudit();renderAdminMetrics();updateDashboardMode();
 reportIncome.textContent=money(inc);reportExpense.textContent=money(exp);reportSavings.textContent=money(sav);
 const incomeMeta=document.getElementById("reportIncomeMeta");if(incomeMeta)incomeMeta.textContent=`${data.income.length} income record${data.income.length===1?"":"s"}`;
 const expenseMeta=document.getElementById("reportExpenseMeta");if(expenseMeta)expenseMeta.textContent=`${data.expense.length} spending record${data.expense.length===1?"":"s"}`;
 const goalTarget=sum(data.goals,"target"),goalCurrent=sum(data.goals,"current"),goalPct=goalTarget?Math.min(100,goalCurrent/goalTarget*100):0;
 const savingsMeta=document.getElementById("reportSavingsMeta");if(savingsMeta)savingsMeta.textContent=`${data.goals.length} goal${data.goals.length===1?"":"s"} · ${goalPct.toFixed(0)}% funded`;
 const reportInvestments=document.getElementById("reportInvestments");if(reportInvestments)reportInvestments.textContent=money(inv);
 const investmentGain=sum(data.investments.map(x=>({amount:Number(x.value)-Number(x.capital)})));
 const investmentMeta=document.getElementById("reportInvestmentsMeta");if(investmentMeta)investmentMeta.textContent=`${data.investments.length} investment${data.investments.length===1?"":"s"} · ${investmentGain>=0?"+":"-"}${money(Math.abs(investmentGain))} gain`;
 const reportProtection=document.getElementById("reportProtection");if(reportProtection)reportProtection.textContent=money(prot);
 const protectionMeta=document.getElementById("reportProtectionMeta");if(protectionMeta)protectionMeta.textContent=`${data.protection.length} protection record${data.protection.length===1?"":"s"}`;
 portfolioValue.textContent=money(inv);portfolioGain.textContent=money(sum(data.investments.map(x=>({amount:Number(x.value)-Number(x.capital)}))));
 coverageTotal.textContent=money(prot); donutTotal.textContent=money(exp);
 renderIncome();renderExpenses();renderRecent();renderGoals();renderInvestments();renderProtection();health();renderAnalytics();
 updateCharts();
}
function rowActions(id,type){return `<button class="action-btn delete" data-id="${id}" data-type="${type}" title="Delete">×</button>`}
function renderIncome(){incomeTable.innerHTML=data.income.length?data.income.map(x=>`<tr><td><b>${x.desc}</b></td><td><span class="tag">${x.cat}</span></td><td>${x.date}</td><td class="amount-income">+${money(x.amount)}</td><td>${rowActions(x.id,"income")}</td></tr>`).join(""):`<tr><td colspan="5" class="empty">No income records yet.</td></tr>`}
function renderExpenses(){expenseTable.innerHTML=data.expense.length?data.expense.map(x=>`<tr><td><b>${x.desc}</b></td><td><span class="tag">${x.cat}</span></td><td>${x.date}</td><td class="amount-expense">-${money(x.amount)}</td><td>${rowActions(x.id,"expense")}</td></tr>`).join(""):`<tr><td colspan="5" class="empty">No expense records yet.</td></tr>`}
function renderRecent(){let all=[...data.income.map(x=>({...x,type:"income"})),...data.expense.map(x=>({...x,type:"expense"}))].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6);recentTable.innerHTML=all.length?all.map(x=>`<tr><td><b>${escapeHtml(x.desc)}</b></td><td><span class="tag">${escapeHtml(x.cat)}</span></td><td>${x.date}</td><td class="${x.type==="income"?"amount-income":"amount-expense"}">${x.type==="income"?"+":"-"}${money(x.amount)}</td></tr>`).join(""):`<tr><td colspan="4" class="empty"><b>No transactions yet</b><br><small>Add your first income or expense to start building your financial history.</small></td></tr>`}
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
function renderInvestments(){investmentTable.innerHTML=data.investments.length?data.investments.map(x=>{let g=x.value-x.capital;return `<tr><td><b>${escapeHtml(x.name)}</b></td><td><span class="tag">${escapeHtml(x.type)}</span></td><td>${money(x.capital)}</td><td>${money(x.value)}</td><td class="${g>=0?"amount-income":"amount-expense"}">${g>=0?"+":""}${money(g)}</td><td>${rowActions(x.id,"investments")}</td></tr>`}).join(""):`<tr><td colspan="6" class="empty"><b>No investments yet</b><br><small>Add your first investment to start tracking portfolio performance.</small></td></tr>`}
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
function renderAccounts(){const el=document.getElementById("accountsTable");if(!el)return;const rows=(data.accounts||[]).map(x=>`<tr><td><b>${escapeHtml(x.name)}</b></td><td><span class="tag">${escapeHtml(x.type||"Cash")}</span></td><td>${money(x.balance)}</td><td>${rowActions(x.id,"accounts")}</td></tr>`).join("");el.innerHTML=rows||`<tr><td colspan="4" class="empty">No accounts yet. Add your first bank, wallet or cash account.</td></tr>`;const total=document.getElementById("accountsTotal");if(total)total.textContent=money(sum(data.accounts||[],"balance"));}
function renderDebts(){const el=document.getElementById("debtsTable");if(!el)return;const rows=(data.debts||[]).map(x=>`<tr><td><b>${escapeHtml(x.name)}</b></td><td>${money(x.balance)}</td><td>${Number(x.interest||0).toFixed(2)}%</td><td>${money(x.payment||0)}</td><td>${escapeHtml(x.due||"—")}</td><td>${rowActions(x.id,"debts")}</td></tr>`).join("");el.innerHTML=rows||`<tr><td colspan="6" class="empty">No debts recorded yet.</td></tr>`;const t=document.getElementById("totalDebt"),p=document.getElementById("debtPayments");if(t)t.textContent=money(sum(data.debts||[],"balance"));if(p)p.textContent=money(sum(data.debts||[],"payment"));}
function renderRecurring(){const el=document.getElementById("recurringTable");if(!el)return;const rows=(data.recurring||[]).map(x=>`<tr><td><b>${escapeHtml(x.desc)}</b></td><td><span class="tag">${escapeHtml(x.type)}</span></td><td>${money(x.amount)}</td><td>${escapeHtml(x.frequency)}</td><td>${escapeHtml(x.nextDate)}</td><td><span class="status">${x.active===false?"Paused":"Active"}</span></td><td>${rowActions(x.id,"recurring")}</td></tr>`).join("");el.innerHTML=rows||`<tr><td colspan="7" class="empty">No recurring transactions yet.</td></tr>`;}
function renderAudit(){const logs=data.audit||[];["auditLogList","dashboardAuditLogList"].forEach(id=>{const el=document.getElementById(id);if(!el)return;el.innerHTML=logs.length?logs.slice(0,30).map(x=>`<div class="audit-row"><span>${new Date(x.at).toLocaleString()}</span><b>${escapeHtml(x.action)}</b><small>${escapeHtml(x.details)}</small></div>`).join(""):"<div class='empty'>No activity recorded yet.</div>";});}
function renderAdminMetrics(){
 const allUsers=getUsers();
 // Admin is a system account, not a client. Never include it in client/user or transaction statistics.
 const regularUsers=allUsers.filter(u=>u.role!=="admin"&&normalizeEmail(u.email)!==AUTH_EMAIL);
 const records=regularUsers.reduce((total,u)=>{
   const d=getUserData(u.email);
   return total+(Array.isArray(d.income)?d.income.length:0)+(Array.isArray(d.expense)?d.expense.length:0);
 },0);
 const admins=allUsers.filter(x=>x.role==="admin"||normalizeEmail(x.email)===AUTH_EMAIL).length;
 ["adminUsersMetric","dashboardAdminUsersMetric"].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=regularUsers.length;});
 ["adminRecordsMetric","dashboardAdminRecordsMetric"].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=records;});
 ["adminActiveMetric","dashboardAdminActiveMetric"].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=admins;});
}
function promptAccount(){const name=(prompt("Account name:")||"").trim();if(!name)return;const type=(prompt("Type (Bank, E-Wallet, Cash, Credit):","Bank")||"Bank").trim();const balance=Number(prompt("Current balance:","0"));if(!Number.isFinite(balance)||balance<0)return alert("Balance must be 0 or greater.");data.accounts.push({id:Date.now(),name,type,balance});audit("Account added",name+" • "+money(balance));save();render();}
function promptDebt(){const name=(prompt("Debt name:")||"").trim();if(!name)return;const balance=Number(prompt("Outstanding balance:","0"));const interest=Number(prompt("Interest rate (%):","0"));const payment=Number(prompt("Monthly payment:","0"));const due=(prompt("Due date (optional):","")||"").trim();if(!Number.isFinite(balance)||balance<0||!Number.isFinite(interest)||interest<0||!Number.isFinite(payment)||payment<0)return alert("Please enter valid debt values.");data.debts.push({id:Date.now(),name,balance,interest,payment,due});audit("Debt added",name+" • "+money(balance)+" outstanding");save();render();}
function promptRecurring(){const desc=(prompt("Description:")||"").trim();if(!desc)return;const type=(prompt("Type (Income or Expense):","Expense")||"Expense").trim();const amount=Number(prompt("Amount:","0"));const frequency=(prompt("Frequency (Monthly, Weekly, Yearly):","Monthly")||"Monthly").trim();const nextDate=(prompt("Next date (YYYY-MM-DD):",today)||today).trim();if(!Number.isFinite(amount)||amount<=0)return alert("Amount must be greater than 0.");data.recurring.push({id:Date.now(),desc,type,amount,frequency,nextDate,active:true});audit("Recurring transaction added",desc+" • "+money(amount)+" • "+frequency);save();render();}
function health(){
 const i=sum(data.income),e=sum(data.expense),goalTarget=sum(data.goals,"target"),goalCurrent=sum(data.goals,"current"),inv=sum(data.investments,"value"),prot=sum(data.protection);
 const hasActivity=i>0||e>0||data.goals.length||data.investments.length||data.protection.length;
 if(!hasActivity){
  healthScore.textContent="—";healthText.textContent="Add your first financial record to calculate your financial health score.";
  const hp=document.getElementById("healthProgress");if(hp)hp.style.width="0%";
  const hb=document.getElementById("healthBreakdown");if(hb)hb.innerHTML="";
  return;
 }
 const cashScore=i>0?Math.max(0,Math.min(40,(i-e)/i*40)):0;
 const savingsScore=goalTarget>0?Math.min(20,goalCurrent/goalTarget*20):(goalCurrent>0?20:0);
 const investScore=inv>0?15:0;
 const protectScore=prot>0?15:0;
 const budget=Number(settings.budget)||0,currentMonth=monthKey(today),monthSpend=sum(data.expense.filter(x=>monthKey(x.date)===currentMonth));
 const budgetScore=budget>0?(monthSpend<=budget?10:Math.max(0,10-(monthSpend-budget)/budget*10)):0;
 const score=Math.round(Math.max(0,Math.min(100,cashScore+savingsScore+investScore+protectScore+budgetScore)));
 healthScore.textContent=score;
 const hp=document.getElementById("healthProgress");if(hp)hp.style.width=`${score}%`;
 const breakdown=document.getElementById("healthBreakdown");
 if(breakdown)breakdown.innerHTML=[
  ["Cash flow",cashScore,40],["Savings goals",savingsScore,20],["Investments",investScore,15],["Protection",protectScore,15],["Budget",budgetScore,10]
 ].map(([label,val,max])=>`<div><span>${label}</span><b>${Math.round(val)}/${max}</b><i><em style="width:${max?val/max*100:0}%"></em></i></div>`).join("");
 healthText.textContent=score>=80?"Excellent financial foundation. Keep your spending controlled and continue building long-term wealth.":score>=60?"Good progress. Focus on your weakest areas and keep your monthly spending within your budget.":"There is room to improve. Start with positive cash flow, a savings goal and consistent expense tracking.";
}
let cashChart,expenseChart;
let analyticsTrendChart;
function getAnalyticsMonths(limit){
 const keys=[...data.income,...data.expense].map(x=>monthKey(x.date)).filter(Boolean).sort();
 return [...new Set(keys)].slice(-limit);
}
function renderAnalytics(){
 const totalIncome=sum(data.income), totalExpense=sum(data.expense);
 const net=totalIncome-totalExpense;
 const months=getAnalyticsMonths(12);
 const currentMonth=monthKey(today);
 const monthExpense=sum(data.expense.filter(x=>monthKey(x.date)===currentMonth));
 const budget=Number(settings.budget)||0;
 const netEl=document.getElementById("analyticsNet"), rateEl=document.getElementById("analyticsSavingsRate");
 const avgEl=document.getElementById("analyticsAvgSpend"), topEl=document.getElementById("analyticsTopCategory"), topAmtEl=document.getElementById("analyticsTopCategoryAmount");
 if(netEl)netEl.textContent=money(net);
 if(rateEl)rateEl.textContent=totalIncome>0?`${((net/totalIncome)*100).toFixed(1)}%`:"—";
 if(avgEl)avgEl.textContent=money(months.length?totalExpense/months.length:0);
 const cats={};data.expense.forEach(x=>{cats[x.cat]=(cats[x.cat]||0)+Number(x.amount)});
 const top=Object.entries(cats).sort((a,b)=>b[1]-a[1])[0];
 if(topEl)topEl.textContent=top?escapeHtml(top[0]):"—";
 if(topAmtEl)topAmtEl.textContent=top?`${money(top[1])} total`:"No spending recorded";
 const insights=document.getElementById("analyticsInsights");
 if(insights){
   if(!totalIncome&&!totalExpense&&!data.goals.length&&!data.investments.length&&!data.protection.length){
     insights.innerHTML=`<div class="analytics-empty"><span>✦</span><b>Your analytics will appear here</b><small>Add your first income or expense to start seeing real trends and insights.</small></div>`;
   }else{
     const items=[];
     if(totalIncome||totalExpense){
       items.push({tone:net>=0?"good":"warn",icon:net>=0?"↗":"↘",title:net>=0?"Positive cash flow":"Spending is higher than income",text:`Your recorded income is ${money(totalIncome)} and spending is ${money(totalExpense)}, leaving ${money(net)} net cash flow.`});
     }
     if(top)items.push({tone:"info",icon:"◌",title:`Top category: ${escapeHtml(top[0])}`,text:`${money(top[1])} has been spent in this category, representing ${totalExpense?((top[1]/totalExpense)*100).toFixed(1):0}% of total spending.`});
     if(budget>0){
       const pct=monthExpense/budget*100;
       items.push({tone:pct<=80?"good":"warn",icon:"₱",title:`${pct.toFixed(0)}% of monthly budget used`,text:`You've spent ${money(monthExpense)} of your ${money(budget)} budget this month.`});
     }
     if(data.goals.length){
       const goalTarget=sum(data.goals,"target"), goalCurrent=sum(data.goals,"current"), gp=goalTarget?Math.min(100,goalCurrent/goalTarget*100):0;
       items.push({tone:gp>=75?"good":"info",icon:"◎",title:`Savings goals are ${gp.toFixed(0)}% funded`,text:`${money(goalCurrent)} saved toward ${money(goalTarget)} across ${data.goals.length} goal${data.goals.length===1?"":"s"}.`});
     }
     if(data.protection.length)items.push({tone:"good",icon:"✦",title:"Protection is active",text:`You have ${data.protection.length} protection record${data.protection.length===1?"":"s"} totaling ${money(sum(data.protection))}.`});
     insights.innerHTML=items.slice(0,5).map(i=>`<div class="analytics-insight ${i.tone}"><span class="analytics-insight-icon">${i.icon}</span><div><b>${i.title}</b><small>${i.text}</small></div></div>`).join("");
   }
 }
 const canvas=document.getElementById("analyticsTrendChart");
 const range=document.getElementById("analyticsRange");
 const limit=(range?.value||"Last 6 months").includes("12")?12:6;
 const trendMonths=months.slice(-limit);
 if(analyticsTrendChart){analyticsTrendChart.destroy();analyticsTrendChart=null}
 if(canvas){
   if(!trendMonths.length){
     canvas.style.display="none";
     const panel=canvas.closest(".analytics-trend-panel");
     if(panel&&!panel.querySelector(".analytics-trend-empty")){
       const e=document.createElement("div");e.className="chart-empty analytics-trend-empty";e.innerHTML=`<div class="chart-empty-icon">↗</div><b>No monthly data yet</b><span>Add income or expense records to build your performance trend.</span>`;canvas.parentNode.insertBefore(e,canvas.nextSibling);
     }
   }else{
     canvas.style.display="block";canvas.closest(".analytics-trend-panel")?.querySelector(".analytics-trend-empty")?.remove();
     const inc=trendMonths.map(k=>sum(data.income.filter(x=>monthKey(x.date)===k)));
     const exp=trendMonths.map(k=>sum(data.expense.filter(x=>monthKey(x.date)===k)));
     const netVals=inc.map((v,i)=>v-exp[i]);
     analyticsTrendChart=new Chart(canvas,{type:"bar",data:{labels:trendMonths.map(monthLabel),datasets:[
       {label:"Income",data:inc,borderWidth:0,borderRadius:5},
       {label:"Spending",data:exp,borderWidth:0,borderRadius:5},
       {label:"Net",data:netVals,type:"line",borderWidth:2,tension:.3,pointRadius:3}
     ]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:"index",intersect:false},layout:{padding:{top:4,right:4,bottom:0,left:0}},plugins:{legend:{position:"bottom",labels:{font:{size:9},boxWidth:18,boxHeight:8,padding:12,usePointStyle:false}},tooltip:{padding:10,callbacks:{label:c=>`${c.dataset.label}: ${money(c.raw)}`}}},scales:{y:{beginAtZero:true,ticks:{maxTicksLimit:6,callback:v=>money(v)}},x:{grid:{display:false},ticks:{autoSkip:true,maxTicksLimit:10,maxRotation:0}}}}});
   }
 }
}

function monthKey(date){const d=new Date(`${date}T00:00:00`);return Number.isNaN(d.getTime())?null:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`}
function monthLabel(key){const [y,m]=key.split("-").map(Number);return new Intl.DateTimeFormat("en-US",{month:"short"}).format(new Date(y,m-1,1))}
function dateKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function startOfWeek(d){const x=new Date(d);x.setHours(0,0,0,0);const day=x.getDay();const diff=day===0?-6:1-day;x.setDate(x.getDate()+diff);return x}
function periodDateKeys(start,end){const keys=[];const d=new Date(start);d.setHours(0,0,0,0);const last=new Date(end);last.setHours(0,0,0,0);while(d<=last){keys.push(dateKey(d));d.setDate(d.getDate()+1)}return keys}
function getCashFlowPeriods(range){
 const now=new Date();now.setHours(0,0,0,0);
 if(range==="This week"){const start=startOfWeek(now);return {type:"day",keys:periodDateKeys(start,now),labels:periodDateKeys(start,now).map(k=>{const d=new Date(`${k}T00:00:00`);return new Intl.DateTimeFormat("en-US",{weekday:"short"}).format(d)}),title:"This week"};}
 if(range==="This month"){const start=new Date(now.getFullYear(),now.getMonth(),1);const keys=periodDateKeys(start,now);return {type:"day",keys,labels:keys.map(k=>{const d=new Date(`${k}T00:00:00`);return String(d.getDate())}),title:new Intl.DateTimeFormat("en-US",{month:"long",year:"numeric"}).format(now)};}
 if(range==="Last 4 weeks"){const currentWeek=startOfWeek(now);const starts=[];for(let i=3;i>=0;i--){const d=new Date(currentWeek);d.setDate(d.getDate()-i*7);starts.push(d)}return {type:"week",keys:starts.map(dateKey),labels:starts.map((d,i)=>`W${i+1}`),starts,title:"Last 4 weeks"};}
 const limit=range.includes("12")?12:6;const months=[];const base=new Date(now.getFullYear(),now.getMonth(),1);for(let i=limit-1;i>=0;i--){months.push(new Date(base.getFullYear(),base.getMonth()-i,1))}return {type:"month",keys:months.map(d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`),labels:months.map(d=>new Intl.DateTimeFormat("en-US",{month:"short"}).format(d)),title:range};
}
function getCashFlowAmounts(period){
 const amountFor=(arr,key)=>sum(arr.filter(x=>{const d=String(x.date||"");if(period.type==="day")return period.keys.includes(d);if(period.type==="week"){const dt=new Date(`${d}T00:00:00`);const current=period.starts.findIndex(st=>{const end=new Date(st);end.setDate(end.getDate()+6);return dt>=st&&dt<=end});return current>=0;}return monthKey(d)===key}),"amount");
 if(period.type==="day")return {income:period.keys.map(k=>amountFor(data.income,k)),expense:period.keys.map(k=>amountFor(data.expense,k))};
 if(period.type==="week")return {income:period.starts.map(st=>{const end=new Date(st);end.setDate(end.getDate()+6);return sum(data.income.filter(x=>{const d=new Date(`${x.date}T00:00:00`);return d>=st&&d<=end}),"amount")}),expense:period.starts.map(st=>{const end=new Date(st);end.setDate(end.getDate()+6);return sum(data.expense.filter(x=>{const d=new Date(`${x.date}T00:00:00`);return d>=st&&d<=end}),"amount")})};
 return {income:period.keys.map(k=>sum(data.income.filter(x=>monthKey(x.date)===k),"amount")),expense:period.keys.map(k=>sum(data.expense.filter(x=>monthKey(x.date)===k),"amount"))};
}
function showChartEmpty(canvas,message,detail){const panel=canvas.closest(".chart-panel");if(!panel)return;canvas.style.display="none";let empty=panel.querySelector(`.chart-empty[data-for="${canvas.id}"]`);if(!empty){empty=document.createElement("div");empty.className="chart-empty";empty.dataset.for=canvas.id;canvas.parentNode.insertBefore(empty,canvas.nextSibling)}empty.innerHTML=`<div class="chart-empty-icon">${canvas.id==="cashFlowChart"?"↗":"◌"}</div><b>${message}</b><span>${detail}</span>`;empty.classList.remove("hidden")}
function hideChartEmpty(canvas){const panel=canvas.closest(".chart-panel");if(!panel)return;canvas.style.display="block";panel.querySelector(`.chart-empty[data-for="${canvas.id}"]`)?.classList.add("hidden")}
function updateCashFlowSummary(income,expense,title){
 const inc=sum(income),exp=sum(expense),net=inc-exp,rate=inc>0?(net/inc)*100:0;
 const i=document.getElementById("cashFlowIncomeSummary"),e=document.getElementById("cashFlowExpenseSummary"),n=document.getElementById("cashFlowNetSummary"),r=document.getElementById("cashFlowRateSummary");
 if(i)i.textContent=money(inc);
 if(e)e.textContent=money(exp);
 if(n){n.textContent=money(net);n.classList.toggle("positive",net>0);n.classList.toggle("negative",net<0)}
 if(r)r.textContent=inc>0?`${rate.toFixed(1)}%`:exp>0?"N/A":"—";
 const panel=document.querySelector(".cash-flow-panel");
 if(panel)panel.dataset.period=title||"";
 const label=document.getElementById("cashFlowPeriodLabel");
 if(label)label.textContent=title?`Selected period: ${title}`:"";
 const incomeCount=document.getElementById("cashFlowIncomeCount"),expenseCount=document.getElementById("cashFlowExpenseCount");
 if(incomeCount)incomeCount.textContent=`${income.filter(v=>Number(v)>0).length} active period${income.filter(v=>Number(v)>0).length===1?"":"s"}`;
 if(expenseCount)expenseCount.textContent=`${expense.filter(v=>Number(v)>0).length} active period${expense.filter(v=>Number(v)>0).length===1?"":"s"}`;
}
function filterExpensesForCashPeriod(period){
 if(period.type==="day")return data.expense.filter(x=>period.keys.includes(String(x.date||"")));
 if(period.type==="week"){
  return data.expense.filter(x=>{
   const dt=new Date(`${String(x.date||"")}T00:00:00`);
   if(Number.isNaN(dt.getTime()))return false;
   return period.starts.some(st=>{const end=new Date(st);end.setDate(end.getDate()+6);return dt>=st&&dt<=end});
  });
 }
 return data.expense.filter(x=>period.keys.includes(monthKey(x.date)));
}
function updateCharts(){
 const cashCanvas=document.getElementById("cashFlowChart");
 const range=document.getElementById("chartRange")?.value||"This month";
 const period=getCashFlowPeriods(range);
 const amounts=getCashFlowAmounts(period);
 updateCashFlowSummary(amounts.income,amounts.expense,period.title);
 if(cashChart){cashChart.destroy();cashChart=null}
 const hasActivity=amounts.income.some(v=>v>0)||amounts.expense.some(v=>v>0);
 if(!hasActivity){showChartEmpty(cashCanvas,"No financial activity for this period","Add income or spending records to build your cash-flow report.")}
 else{
  hideChartEmpty(cashCanvas);
  const netVals=amounts.income.map((v,i)=>v-amounts.expense[i]);
  cashChart=new Chart(cashCanvas,{type:"bar",data:{labels:period.labels,datasets:[{label:"Income",data:amounts.income,borderWidth:0,borderRadius:5},{label:"Spending",data:amounts.expense,borderWidth:0,borderRadius:5},{label:"Net",data:netVals,type:"line",borderWidth:2,tension:.3,pointRadius:3}]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:"index",intersect:false},plugins:{legend:{position:"bottom",labels:{font:{size:10}}},tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${money(c.raw)}`}}},scales:{y:{beginAtZero:true,ticks:{callback:v=>money(v)}},x:{grid:{display:false}}}}});
 }
 const expenseRecords=filterExpensesForCashPeriod(period);
 const cats={};expenseRecords.forEach(x=>cats[x.cat]=(cats[x.cat]||0)+Number(x.amount));let labels=Object.keys(cats);let vals=Object.values(cats);const expenseCanvas=document.getElementById("expenseChart");
 const spendingSubtitle=document.getElementById("spendingBreakdownSubtitle");
 if(spendingSubtitle)spendingSubtitle.textContent=`Where your money goes · ${period.title}`;
 if(expenseChart){expenseChart.destroy();expenseChart=null}
 if(!vals.length){showChartEmpty(expenseCanvas,"No spending recorded yet","Add an expense in this selected period to see your breakdown.");document.getElementById("donutTotal").textContent=money(0);legend.innerHTML=""}
 else{hideChartEmpty(expenseCanvas);expenseChart=new Chart(expenseCanvas,{type:"doughnut",data:{labels,datasets:[{data:vals,borderWidth:0}]},options:{cutout:"73%",plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.label}: ${money(c.raw)}`}}}}});document.getElementById("donutTotal").textContent=money(sum(expenseRecords,"amount"));const colors=["#635bff","#18a86b","#e5a12e","#ed5c61","#4285e8","#9a6be8"];legend.innerHTML=labels.map((l,i)=>`<span style="--c:${colors[i%colors.length]}">${escapeHtml(l)} ${money(cats[l])}</span>`).join("")}
}
function openModal(type="income"){formType.value=type;modalTitle.textContent=type==="income"?"Add Income":"Add Expense";fCategory.innerHTML=(type==="income"?["Salary","Freelance","Business","Bonus","Other"]:["Food","Bills","Transport","Shopping","Entertainment","Health","Other"]).map(x=>`<option>${x}</option>`).join("");fDate.value=today;fDesc.value="";fAmount.value="";fNotes.value="";modal.classList.remove("hidden")}
function updateDashboardMode(){const admin=isAdmin();document.body.classList.toggle("admin-mode",admin);const regular=document.getElementById("regularDashboardView"),view=document.getElementById("adminDashboardView"),quick=document.getElementById("quickAdd");if(regular)regular.classList.toggle("hidden",admin);if(view)view.classList.toggle("hidden",!admin);if(quick)quick.classList.toggle("hidden",admin);const profileType=document.querySelector("#profileName + small");if(profileType)profileType.textContent=admin?"Administrator":"Personal Account";}
function showPage(id){
 const admin=isAdmin();
 const clientAllowed=["dashboard","income","expenses","savings","investments","protection","reports","settings"];
 if(admin && id!=="dashboard")id="dashboard";
 if(!admin && !clientAllowed.includes(id))id="dashboard";
 document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));
 const page=document.getElementById(id);
 if(page)page.classList.remove("hidden");
 document.querySelectorAll(".nav-link").forEach(a=>a.classList.toggle("active",a.dataset.page===id));
 pageTitle.textContent=id[0].toUpperCase()+id.slice(1);
 updateDashboardMode();
 if(innerWidth<=700)setSidebarOpen(false)
}
document.querySelectorAll(".nav-link,[data-page]").forEach(a=>a.addEventListener("click",()=>showPage(a.dataset.page)));
quickAdd.onclick=()=>openModal("expense");closeModal.onclick=()=>modal.classList.add("hidden");modal.onclick=e=>{if(e.target===modal)modal.classList.add("hidden")};
document.querySelectorAll(".add-page").forEach(b=>b.onclick=()=>openModal(b.dataset.type));
transactionForm.onsubmit=e=>{
 e.preventDefault();
 const type=formType.value,desc=fDesc.value.trim(),cat=fCategory.value,date=fDate.value,amount=Number(fAmount.value);
 if(!desc){alert("Please enter a description.");fDesc.focus();return;}
 if(!date||Number.isNaN(new Date(`${date}T00:00:00`).getTime())){alert("Please enter a valid date.");fDate.focus();return;}
 if(!Number.isFinite(amount)||amount<=0){alert("Amount must be greater than 0.");fAmount.focus();return;}
 data[type].push({id:Date.now(),desc,cat,date,amount,notes:fNotes.value.trim()});
 audit(type==="income"?"Income added":"Expense added",desc+" • "+money(amount));save();updateProfileUI();render();modal.classList.add("hidden")
};
document.addEventListener("click",e=>{if(e.target.classList.contains("delete")){let t=e.target.dataset.type,id=Number(e.target.dataset.id);if(t==="goals"&&!confirm("Remove this savings goal?"))return;const removed=data[t].find(x=>x.id===id);data[t]=data[t].filter(x=>x.id!==id);audit(t+" deleted",removed?.name||removed?.desc||("Record "+id));save();render()}});
addGoal.onclick=()=>{let name=prompt("Goal name:");if(!name)return;let target=Number(prompt("Target amount:","50000"));if(!Number.isFinite(target)||target<=0)return;data.goals.push({id:Date.now(),name:name.trim(),target,current:0});audit("Savings goal added",name.trim()+" • target "+money(target));save();render()};
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
addInvestment.onclick=()=>{
 let name=(prompt("Investment name:")||"").trim();if(!name)return;
 let capital=Number(prompt("Capital:","10000"));if(!Number.isFinite(capital)||capital<=0){alert("Capital must be greater than 0.");return;}
 let value=Number(prompt("Current value:",capital));if(!Number.isFinite(value)||value<0){alert("Current value must be 0 or greater.");return;}
 data.investments.push({id:Date.now(),name,type:"Investment",capital,value});audit("Investment added",name+" • "+money(value));save();render()
};

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
 audit(goalAction.value==="add"?"Savings added":"Savings withdrawn",goal.name+" • "+money(amount));save();render();goalModal.classList.add("hidden");
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
document.getElementById("addAccount")?.addEventListener("click",promptAccount);document.getElementById("addDebt")?.addEventListener("click",promptDebt);document.getElementById("addRecurring")?.addEventListener("click",promptRecurring);
const mobileSidebarOverlay=document.getElementById("mobileSidebarOverlay");
function setSidebarOpen(open){sidebar.classList.toggle("open",open);document.body.classList.toggle("sidebar-open",open);if(mobileSidebarOverlay)mobileSidebarOverlay.setAttribute("aria-hidden",open?"false":"true");if(menuBtn)menuBtn.setAttribute("aria-expanded",open?"true":"false");}
menuBtn.onclick=()=>setSidebarOpen(!sidebar.classList.contains("open"));
mobileSidebarOverlay?.addEventListener("click",()=>setSidebarOpen(false));
window.addEventListener("resize",()=>{if(innerWidth>700)setSidebarOpen(false)});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&sidebar.classList.contains("open"))setSidebarOpen(false)});
themeBtn.onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem("fintrackDark",document.body.classList.contains("dark"))};if(localStorage.getItem("fintrackDark")==="true")document.body.classList.add("dark");
function renderAdminAccounts(){
 const targets=[{list:"dashboardAdminAccountList",count:"dashboardAdminAccountCount",message:"dashboardAdminMessage"},{list:"adminAccountList",count:"adminAccountCount",message:"adminMessage"}];
 if(!isAdmin())return;
 const users=getUsers();
 targets.forEach(t=>{const list=document.getElementById(t.list),count=document.getElementById(t.count);if(count)count.textContent=`${users.length} account${users.length===1?"":"s"}`;if(!list)return;list.innerHTML=users.map(u=>{const adminUser=u.role==="admin"||normalizeEmail(u.email)===AUTH_EMAIL;const display=escapeHtml(u.displayName||"Unnamed User"),email=escapeHtml(u.email||""),created=u.createdAt?new Date(u.createdAt).toLocaleDateString():"—";return `<div class="admin-account-row"><div class="admin-account-main"><div class="admin-account-avatar">${initials(u.displayName||u.email)}</div><div><b>${display}</b><span>${email}</span><small>${adminUser?"Administrator":"User"} · Created ${created}</small></div></div><div class="admin-account-actions">${adminUser?'<span class="admin-role-badge">Admin</span>':'<button type="button" class="danger-outline admin-delete-user" data-email="'+encodeURIComponent(u.email)+'">Delete</button>'}</div></div>`;}).join("");list.querySelectorAll(".admin-delete-user").forEach(btn=>btn.onclick=()=>{const email=decodeURIComponent(btn.dataset.email||""),user=getUsers().find(x=>normalizeEmail(x.email)===normalizeEmail(email));if(!user||user.role==="admin")return;if(!confirm(`Delete the account ${user.email} and all of its financial data? This cannot be undone.`))return;saveUsers(getUsers().filter(x=>normalizeEmail(x.email)!==normalizeEmail(email)));removeUserData(email);renderAdminAccounts();renderAdminMetrics();targets.forEach(x=>setAuthMessage(document.getElementById(x.message),`Account ${user.email} was deleted.`,true));});});
}

function updateProfileUI(){
 const name=(settings.displayName||defaultSettings.displayName).trim()||defaultSettings.displayName;
 const profileName=document.getElementById("profileName"), profileAvatar=document.getElementById("profileAvatar"), greeting=document.getElementById("welcomeGreeting");
 if(profileName)profileName.textContent=name;
 const topProfileName=document.getElementById("topProfileName");
 if(topProfileName)topProfileName.textContent=name;
 if(profileAvatar)profileAvatar.textContent=initials(name);
 if(greeting)greeting.textContent=`${getGreeting()}, ${name} 👋`;
 const currency=document.getElementById("currencySetting"), budget=document.getElementById("budgetSetting"), display=document.getElementById("displayNameSetting"), budgetStatus=document.getElementById("budgetStatus"), accountEmail=document.getElementById("accountEmail");
 if(currency)currency.value=settings.currency||"PHP";
 if(budget)budget.value=Number(settings.budget)||0;
 if(display)display.value=name;
 if(accountEmail)accountEmail.value=activeEmail();
 if(budgetStatus){const b=Number(settings.budget)||0, spent=sum(data.expense); budgetStatus.textContent=b>0?`This month: ${money(spent)} spent • ${money(Math.max(0,b-spent))} remaining`:`Set a monthly budget to track your remaining amount.`;}
 renderAdminAccounts();
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
 updateStoredUserProfile(display);
 render();
 alert("Settings saved successfully.");
}
saveSettings.onclick=saveSettingsForm;
exportBtn.onclick=()=>{let rows=[["Type","Description","Category","Date","Amount"],...data.income.map(x=>["Income",x.desc,x.cat,x.date,x.amount]),...data.expense.map(x=>["Expense",x.desc,x.cat,x.date,x.amount])];let csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");let a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="fintrack-report.csv";a.click()};
document.getElementById("chartRange")?.addEventListener("change",updateCharts);
render();

// Authentication: local browser accounts for this browser-only application.
function getLoginAttemptState(){try{return JSON.parse(localStorage.getItem(LOGIN_ATTEMPTS_KEY)||"{}")||{};}catch{return {};}}
function isLoginLocked(identifier){const state=getLoginAttemptState()[identifier];if(!state)return false;if(state.lockedUntil&&Date.now()<state.lockedUntil)return true;if(state.lockedUntil&&Date.now()>=state.lockedUntil){const all=getLoginAttemptState();delete all[identifier];localStorage.setItem(LOGIN_ATTEMPTS_KEY,JSON.stringify(all));}return false;}
function recordLoginFailure(identifier){const all=getLoginAttemptState();const state=all[identifier]||{count:0};state.count=(state.count||0)+1;if(state.count>=MAX_LOGIN_ATTEMPTS){state.lockedUntil=Date.now()+LOGIN_LOCK_MS;state.count=0;}all[identifier]=state;localStorage.setItem(LOGIN_ATTEMPTS_KEY,JSON.stringify(all));return state.lockedUntil||0;}
function clearLoginFailures(identifier){const all=getLoginAttemptState();delete all[identifier];localStorage.setItem(LOGIN_ATTEMPTS_KEY,JSON.stringify(all));}

const loginForm=document.getElementById("loginForm");
const loginEmail=document.getElementById("loginEmail");
const loginPassword=document.getElementById("loginPassword");
const loginMessage=document.getElementById("loginMessage");
const rememberLogin=document.getElementById("rememberLogin");
const togglePassword=document.getElementById("togglePassword");
const logoutBtn=document.getElementById("logoutBtn");
const registerForm=document.getElementById("registerForm");
const registerName=document.getElementById("registerName");
const registerEmail=document.getElementById("registerEmail");
const registerPassword=document.getElementById("registerPassword");
const registerConfirm=document.getElementById("registerConfirm");
const registerMessage=document.getElementById("registerMessage");
const toggleRegisterPassword=document.getElementById("toggleRegisterPassword");
const signInTab=document.getElementById("signInTab");
const registerTab=document.getElementById("registerTab");
const demoCredentials=document.getElementById("demoCredentials");
const setAuthMode=mode=>{const register=mode==="register";signInTab?.classList.toggle("active",!register);registerTab?.classList.toggle("active",register);loginForm?.classList.toggle("hidden",register);registerForm?.classList.toggle("hidden",!register);demoCredentials?.classList.toggle("hidden",register);if(register)registerName?.focus();else loginEmail?.focus();};
signInTab&&(signInTab.onclick=()=>setAuthMode("login"));
registerTab&&(registerTab.onclick=()=>setAuthMode("register"));
if(togglePassword)togglePassword.onclick=()=>{const hidden=loginPassword.type==="password";loginPassword.type=hidden?"text":"password";togglePassword.textContent=hidden?"Hide":"Show";togglePassword.setAttribute("aria-label",hidden?"Hide password":"Show password")};
if(toggleRegisterPassword)toggleRegisterPassword.onclick=()=>{const hidden=registerPassword.type==="password";registerPassword.type=hidden?"text":"password";registerConfirm.type=hidden?"text":"password";toggleRegisterPassword.textContent=hidden?"Hide":"Show";toggleRegisterPassword.setAttribute("aria-label",hidden?"Hide passwords":"Show passwords")};
const setAuthMessage=(el,msg,ok=false)=>{if(!el)return;el.textContent=msg;el.classList.toggle("success",ok)};
if(loginForm)loginForm.onsubmit=e=>{
 e.preventDefault();
 const identifier=String(loginEmail.value||"").trim().toLowerCase(),p=loginPassword.value;
 if(!identifier||!p){setAuthMessage(loginMessage,"Please enter your email/username and password.");return;}
 if(isLoginLocked(identifier)){setAuthMessage(loginMessage,"Too many failed attempts. Please try again in about 5 minutes.");return;}
 const user=getUsers().find(x=>(normalizeEmail(x.email)===identifier||(String(x.username||"").toLowerCase()===identifier&&x.role==="admin"))&&x.password===p);
 if(user){clearLoginFailures(identifier);setAuthenticated(!!rememberLogin.checked);localStorage.setItem(CURRENT_USER_KEY,user.email);loadUserState(user.email);setAuthMessage(loginMessage,"");showApp();updateProfileUI();render();}
 else{const lockedUntil=recordLoginFailure(identifier);setAuthMessage(loginMessage,lockedUntil?"Too many failed attempts. Login is temporarily locked for this identifier.":"Incorrect email/username or password.");loginPassword.focus();loginPassword.select();}
};
const resetLoginForm=()=>{if(loginForm)loginForm.reset();if(loginEmail)loginEmail.value="";if(loginPassword)loginPassword.value="";if(rememberLogin)rememberLogin.checked=false;if(loginPassword)loginPassword.type="password";if(togglePassword){togglePassword.textContent="Show";togglePassword.setAttribute("aria-label","Show password");}setAuthMessage(loginMessage,"");};
const resetRegisterForm=()=>{if(registerForm)registerForm.reset();if(registerPassword)registerPassword.type="password";if(registerConfirm)registerConfirm.type="password";if(toggleRegisterPassword)toggleRegisterPassword.textContent="Show";setAuthMessage(registerMessage,"");};
const showLoginAfterRegistration=(email)=>{resetRegisterForm();setAuthMode("login");if(loginEmail)loginEmail.value=email;if(loginPassword)loginPassword.value="";if(rememberLogin)rememberLogin.checked=false;setAuthMessage(loginMessage,"Account created successfully! Please sign in with your new password.",true);setTimeout(()=>loginPassword?.focus(),0);};
if(registerForm)registerForm.onsubmit=e=>{e.preventDefault();const name=registerName.value.trim(),email=normalizeEmail(registerEmail.value),p=registerPassword.value,c=registerConfirm.value;if(name.length<2){setAuthMessage(registerMessage,"Please enter a display name.");registerName.focus();return;}if(name.length>40){setAuthMessage(registerMessage,"Display name must be 40 characters or fewer.");registerName.focus();return;}if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){setAuthMessage(registerMessage,"Please enter a valid email address.");registerEmail.focus();return;}if(p.length<8){setAuthMessage(registerMessage,"Password must be at least 8 characters.");registerPassword.focus();return;}if(/\s/.test(p)){setAuthMessage(registerMessage,"Password cannot contain spaces.");registerPassword.focus();return;}if(!/[A-Z]/.test(p)||!/[a-z]/.test(p)||!/[0-9]/.test(p)){setAuthMessage(registerMessage,"Use at least one uppercase letter, one lowercase letter and one number.");registerPassword.focus();return;}if(p!==c){setAuthMessage(registerMessage,"Passwords do not match.");registerConfirm.focus();return;}const users=getUsers();if(users.some(x=>normalizeEmail(x.email)===email)){setAuthMessage(registerMessage,"That email is already registered. Please sign in instead.");registerEmail.focus();return;}users.push({email,password:p,displayName:name,createdAt:new Date().toISOString()});saveUsers(users);showLoginAfterRegistration(email);};
if(logoutBtn)logoutBtn.onclick=()=>{clearAuthenticated();localStorage.removeItem(CURRENT_USER_KEY);showLogin();setAuthMode("login");resetLoginForm();setTimeout(()=>loginEmail.focus(),0)};
const useDemoBtn=document.getElementById("useDemoBtn");
if(useDemoBtn)useDemoBtn.onclick=()=>{loginEmail.value=AUTH_USERNAME;loginPassword.value=AUTH_PASSWORD;rememberLogin.checked=true;setAuthMode("login");setAuthMessage(loginMessage,"");loginForm?.requestSubmit();};
const changePasswordForm=document.getElementById("changePasswordForm");
const passwordMessage=document.getElementById("passwordMessage");
const passwordStrength=document.getElementById("passwordStrength");
const updatePasswordStrength=()=>{const p=document.getElementById("newPassword")?.value||"";if(!p){passwordStrength.textContent="Use at least 8 characters.";passwordStrength.className="password-strength";return;}let score=(p.length>=8?1:0)+(p.length>=12?1:0)+(/[A-Z]/.test(p)?1:0)+(/[0-9]/.test(p)?1:0)+(/[^A-Za-z0-9]/.test(p)?1:0);passwordStrength.textContent=score<=2?"Weak password":score===3?"Fair password":"Strong password";passwordStrength.className=`password-strength strength-${score<=2?"weak":score===3?"fair":"strong"}`;};
document.getElementById("newPassword")?.addEventListener("input",updatePasswordStrength);
const changeCurrent=document.getElementById("currentPassword"),changeNew=document.getElementById("newPassword"),changeConfirm=document.getElementById("confirmNewPassword"),toggleChangePasswords=document.getElementById("toggleChangePasswords");
if(toggleChangePasswords)toggleChangePasswords.onclick=()=>{const hidden=changeNew?.type==="password";[changeCurrent,changeNew,changeConfirm].forEach(input=>{if(input)input.type=hidden?"text":"password"});toggleChangePasswords.textContent=hidden?"Hide passwords":"Show passwords";};
if(changePasswordForm)changePasswordForm.onsubmit=e=>{e.preventDefault();const current=document.getElementById("currentPassword").value,newPass=document.getElementById("newPassword").value,confirmNew=document.getElementById("confirmNewPassword").value;const users=getUsers(),u=activeEmail(),idx=users.findIndex(x=>normalizeEmail(x.email)===normalizeEmail(u));if(idx<0)return setAuthMessage(passwordMessage,"Account not found.");if(users[idx].password!==current)return setAuthMessage(passwordMessage,"Current password is incorrect.");if(newPass.length<8||!/[A-Z]/.test(newPass)||!/[a-z]/.test(newPass)||!/[0-9]/.test(newPass))return setAuthMessage(passwordMessage,"New password needs 8+ characters, uppercase, lowercase and a number.");if(newPass!==confirmNew)return setAuthMessage(passwordMessage,"New passwords do not match.");users[idx].password=newPass;users[idx].updatedAt=new Date().toISOString();saveUsers(users);changePasswordForm.reset();updatePasswordStrength();setAuthMessage(passwordMessage,"Password changed successfully.",true);};
const exportBackup=document.getElementById("exportBackup"),importBackupBtn=document.getElementById("importBackupBtn"),importBackupFile=document.getElementById("importBackupFile"),resetDataBtn=document.getElementById("resetDataBtn"),dataMessage=document.getElementById("dataMessage");
if(exportBackup)exportBackup.onclick=()=>{const payload={app:"FinTrack",version:2,email:activeEmail(),exportedAt:new Date().toISOString(),settings,data};const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`fintrack-${userSlug(activeEmail())}-backup.json`;a.click();URL.revokeObjectURL(a.href);setAuthMessage(dataMessage,"Backup downloaded.",true);};
if(importBackupBtn)importBackupBtn.onclick=()=>importBackupFile?.click();
if(importBackupFile)importBackupFile.onchange=async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{
  const payload=JSON.parse(await file.text());
  const allowedArrays=["income","expense","goals","investments","protection","accounts","debts","recurring","audit"];
  if(payload.app!=="FinTrack"||!payload.data||!allowedArrays.every(k=>Array.isArray(payload.data[k]??[])))throw new Error("Invalid backup");
  if(payload.email&&normalizeEmail(payload.email)!==normalizeEmail(activeEmail()))throw new Error("Wrong account");
  const importedSettings={...defaultSettings,...(payload.settings||{})};
  if(!currencyConfig[importedSettings.currency]||!Number.isFinite(Number(importedSettings.budget))||Number(importedSettings.budget)<0)throw new Error("Invalid settings");
  if(!confirm("Restore this backup into your current account? Your current financial data will be replaced."))return;
  data={...emptyData(),...payload.data};
  settings={...defaultSettings,...importedSettings,budget:Number(importedSettings.budget)};
  persistSettings();save();render();setAuthMessage(dataMessage,"Backup restored successfully.",true);
 }catch(err){setAuthMessage(dataMessage,err.message==="Wrong account"?"This backup belongs to a different account.":"Could not restore that backup file. Please choose a valid FinTrack backup.");}
 finally{e.target.value="";}
};
if(resetDataBtn)resetDataBtn.onclick=()=>{if(!confirm("Reset all transactions, savings goals, investments and protection records for this account? This cannot be undone unless you have a backup."))return;data=emptyData();save();render();setAuthMessage(dataMessage,"Your financial data has been reset.",true);};
function handleDeleteAllUsers(){if(!isAdmin())return;const users=getUsers().filter(x=>x.role!=="admin"&&normalizeEmail(x.email)!==AUTH_EMAIL);const messages=["adminMessage","dashboardAdminMessage"];if(!users.length){messages.forEach(id=>setAuthMessage(document.getElementById(id),"There are no user accounts to delete.",true));return;}if(!confirm(`Delete all ${users.length} non-admin accounts and ALL of their financial data? This cannot be undone.`))return;const phrase=prompt("Security check: type DELETE ALL USERS to continue.");if(phrase!=="DELETE ALL USERS"){messages.forEach(id=>setAuthMessage(document.getElementById(id),"Deletion cancelled. The confirmation phrase did not match."));return;}users.forEach(u=>removeUserData(u.email));saveUsers(getUsers().filter(x=>x.role==="admin"||normalizeEmail(x.email)===AUTH_EMAIL));renderAdminAccounts();renderAdminMetrics();messages.forEach(id=>setAuthMessage(document.getElementById(id),`${users.length} user account${users.length===1?"":"s"} deleted successfully.`,true));}
["deleteAllUsersBtn","dashboardDeleteAllUsersBtn"].forEach(id=>{const btn=document.getElementById(id);if(btn)btn.onclick=handleDeleteAllUsers;});
if(authIsActive()){{loadUserState(activeEmail());showApp();}}else {showLogin();resetLoginForm();}

document.getElementById("analyticsRange")?.addEventListener("change",renderAnalytics);
let lastActivityWrite=0;
["click","keydown","mousemove","touchstart"].forEach(evt=>document.addEventListener(evt,()=>{if(Date.now()-lastActivityWrite>30000){lastActivityWrite=Date.now();touchActivity();}}, {passive:true}));
setInterval(()=>{if(!authIsActive()&&document.querySelector(".app:not(.auth-locked)")){clearAuthenticated();showLogin();resetLoginForm();setAuthMessage(loginMessage,"Your session expired due to inactivity. Please sign in again.");}},60000);
