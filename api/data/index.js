const {query}=require("../_lib/db");
const {requireUser,json}=require("../_lib/security");
async function load(userId){
  const [tx,goals,investments,protection,accounts,debts,recurring,audit,settings]=await Promise.all([
    query("select id,type,description as desc,category as cat,amount,transaction_date as date,notes from transactions where user_id=$1 order by transaction_date desc,created_at desc",[userId]),
    query("select id,name,target_amount as target,current_amount as current from savings_goals where user_id=$1 order by created_at",[userId]),
    query("select id,name,investment_type as type,capital,current_value as value,investment_date as date,notes from investments where user_id=$1 order by created_at desc",[userId]),
    query("select id,name,protection_type as type,amount,status from protection_records where user_id=$1 order by created_at",[userId]),
    query("select id,name,account_type as type,balance from accounts where user_id=$1 order by created_at",[userId]),
    query("select id,name,balance,interest_rate as interest,monthly_payment as payment,due_date as due from debts where user_id=$1 order by created_at desc",[userId]),
    query("select id,description as desc,type,amount,frequency,next_date as \"nextDate\",active from recurring_transactions where user_id=$1 order by next_date",[userId]),
    query("select id,action,details,created_at as at from audit_logs where user_id=$1 order by created_at desc limit 100",[userId]),
    query("select currency,monthly_budget as budget,display_name as \"displayName\" from user_settings where user_id=$1",[userId])
  ]);
  return {
    income:tx.rows.filter(x=>x.type==="income"),expense:tx.rows.filter(x=>x.type==="expense"),
    goals:goals.rows,investments:investments.rows,protection:protection.rows,accounts:accounts.rows,
    debts:debts.rows,recurring:recurring.rows,audit:audit.rows,
    settings:settings.rows[0]||{currency:"PHP",budget:30000,displayName:""}
  };
}
module.exports=async(req,res)=>{
  const user=await requireUser(req);if(!user)return json(res,401,{error:"Not authenticated"});
  if(req.method!=="GET")return json(res,405,{error:"Use GET /api/data."});
  return json(res,200,{data:await load(user.id)});
};
module.exports.load=load;
