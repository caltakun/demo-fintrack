const {requireUser,json}=require("../_lib/security");
module.exports=async(req,res)=>{
  if(req.method!=="GET")return json(res,405,{error:"Method not allowed"});
  const user=await requireUser(req); if(!user)return json(res,401,{error:"Not authenticated"});
  return json(res,200,{user});
};
