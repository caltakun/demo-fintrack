const {query}=require("../_lib/db");
const {requireUser,json}=require("../_lib/security");
module.exports=async(req,res)=>{
  const u=await requireUser(req);
  if(!u||u.role!=="admin")return json(res,403,{error:"Administrator access required."});
  if(req.method!=="GET")return json(res,405,{error:"Method not allowed"});
  const summary=(await query("select * from admin_financial_summary")).rows[0];
  const users=(await query("select id,email,display_name as \"displayName\",role,created_at as \"createdAt\" from users order by created_at desc")).rows;
  const logs=(await query("select a.id,a.action,a.details,a.created_at as at,u.email from audit_logs a left join users u on u.id=a.user_id order by a.created_at desc limit 100")).rows;
  return json(res,200,{summary,users,logs});
};
