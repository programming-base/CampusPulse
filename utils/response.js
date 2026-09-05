import paginate from "./pagination.js"

export default function successRes(res,data){
    return res.status(200).json({
        success:true,
        data:data
    })
}
export function paginatedRes(res,{items,page,limit,total,totalPages,hasMore}){
    return res.status(200).json({
        success:true,
        data:paginate(items,page,limit,total,totalPages,hasMore)
    })
}
export function serverError(res){
    return res.status(500).json({
        success:false,
        message:"Internal server error"
    })
}
export function errorRes(res,errorCode,message){
    return res.status(errorCode).json({
        success:false,
        message:message
    })
}


