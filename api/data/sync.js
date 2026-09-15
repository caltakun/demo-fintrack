const {getPool}=require("../_lib/db");
const {requireUser,json}=require("../_lib/security");
const {load}=require("./index");
const n=v=>Number.isFinite(Number(v))?Number(v):0;
const date=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||""))?String(v):new Date().toISOString().slice(0,10);
module.exports=async(req,res)=>{
  const user=await requireUser(req);if(!user)return json(res,401,{error:"Not authenticated"});
  if(req.method!=="POST")return json(res,405,{error:"Method not allowed"});
  const d=(req.body||{}).data||{}, pool=getPool(), c=await pool.connect();
  try{
    await c.query("begin"); const uid=user.id;
    await c.query("delete from transactions where user_id=$1",[uid]);
    for(const x of [...(d.income||[]).map(x=>({...x,_type:"income"})),...(d.expense||[]).map(x=>({...x,_type:"expense"}))])
      await c.query("insert into transactions(user_id,type,description,category,amount,transaction_date,notes) values($1,$2,$3,$4,$5,$6,$7)",[uid,x._type,String(x.desc||"Untitled").slice(0,200),String(x.cat||"Other").slice(0,80),n(x.amount),date(x.date),x.notes||null]);
    await c.query("delete from savings_goals where user_id=$1",[uid]);
    for(const x of d.goals||[])await c.query("insert into savings_goals(user_id,name,target_amount,current_amount) values($1,$2,$3,$4)",[uid,String(x.name||"Savings Goal").slice(0,160),n(x.target),n(x.current)]);
    await c.query("delete from investments where user_id=$1",[uid]);
    for(const x of d.investments||[])await c.query("insert into investments(user_id,name,investment_type,capital,current_value,investment_date,notes) values($1,$2,$3,$4,$5,$6,$7)",[uid,String(x.name||"Investment").slice(0,160),String(x.type||"Investment").slice(0,80),n(x.capital),n(x.value),x.date?date(x.date):null,x.notes||null]);
    await c.query("delete from protection_records where user_id=$1",[uid]);
    for(const x of d.protection||[])await c.query("insert into protection_records(user_id,name,protection_type,amount,status) values($1,$2,$3,$4,$5)",[uid,String(x.name||"Other Protection").slice(0,120),String(x.type||"Other").slice(0,80),n(x.amount),String(x.status||"Active").slice(0,40)]);
    await c.query("delete from accounts where user_id=$1",[uid]);
    for(const x of d.accounts||[])await c.query("insert into accounts(user_id,name,account_type,balance) values($1,$2,$3,$4)",[uid,String(x.name||"Account").slice(0,120),String(x.type||"Cash").slice(0,60),n(x.balance)]);
    await c.query("delete from debts where user_id=$1",[uid]);
    for(const x of d.debts||[])await c.query("insert into debts(user_id,name,balance,interest_rate,monthly_payment,due_date) values($1,$2,$3,$4,$5,$6)",[uid,String(x.name||"Debt").slice(0,160),n(x.balance),n(x.interest),n(x.payment),x.due?date(x.due):null]);
    await c.query("delete from recurring_transactions where user_id=$1",[uid]);
    for(const x of d.recurring||[])await c.query("insert into recurring_transactions(user_id,description,type,amount,frequency,next_date,active) values($1,$2,$3,$4,$5,$6,$7)",[uid,String(x.desc||"Recurring").slice(0,200),x.type==="Income"?"Income":"Expense",n(x.amount),String(x.frequency||"Monthly").slice(0,40),date(x.nextDate),x.active!==false]);
    const s=d.settings||{};
    await c.query(`insert into user_settings(user_id,currency,monthly_budget,display_name) values($1,$2,$3,$4)
      on conflict(user_id) do update set currency=excluded.currency,monthly_budget=excluded.monthly_budget,display_name=excluded.display_name,updated_at=now()`,
      [uid,String(s.currency||"PHP").slice(0,3),n(s.budget||30000),String(s.displayName||user.display_name).slice(0,80)]);
    await c.query("insert into audit_logs(user_id,action,details) values($1,$2,$3)",[uid,"Data synchronized","Browser data migrated to PostgreSQL"]);
    await c.query("commit");return json(res,200,{ok:true,data:await load(uid)});
  }catch(e){await c.query("rollback");console.error(e);return json(res,500,{error:"Synchronization failed."});}
  finally{c.release();}
};
