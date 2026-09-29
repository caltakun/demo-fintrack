const {clearSessionCookie,requireUser,json}=require("../_lib/security");
const {query}=require("../_lib/db");
module.exports=async(req,res)=>{
  if(req.method!=="POST")return json(res,405,{error:"Method not allowed"});
  try{const u=await requireUser(req);if(u)await query("insert into audit_logs(user_id,action,details) values($1,$2,$3)",[u.id,"Logout","Signed out"]);}catch{}
  clearSessionCookie(res);return json(res,200,{ok:true});
};
