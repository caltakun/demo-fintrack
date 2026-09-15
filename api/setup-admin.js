const {query}=require("./_lib/db");
const {hashPassword,json}=require("./_lib/security");
module.exports=async(req,res)=>{
  if(req.method!=="POST")return json(res,405,{error:"Method not allowed"});
  if(!process.env.SETUP_KEY||req.headers["x-setup-key"]!==process.env.SETUP_KEY)return json(res,403,{error:"Invalid setup key."});
  const email=String(process.env.ADMIN_EMAIL||"").trim().toLowerCase(), password=String(process.env.ADMIN_PASSWORD||""), name=String(process.env.ADMIN_DISPLAY_NAME||"FinTrack Administrator");
  if(!email||!password)return json(res,500,{error:"Set ADMIN_EMAIL and ADMIN_PASSWORD first."});
  const hash=await hashPassword(password);
  const {rows}=await query(`insert into users(email,username,password_hash,display_name,role)
    values($1,'admin',$2,$3,'admin')
    on conflict(email) do update set password_hash=excluded.password_hash,display_name=excluded.display_name,role='admin',username='admin'
    returning id,email,username,display_name as "displayName",role`,[email,hash,name]);
  await query(`insert into user_settings(user_id,display_name) values($1,$2)
    on conflict(user_id) do update set display_name=excluded.display_name`,[rows[0].id,name]);
  return json(res,200,{ok:true,user:rows[0]});
};
