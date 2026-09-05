const paginatedData=(items,page,limit,total,totalPages,hasMore)=>{
    return {
            items:items,
            page:page,
            limit:limit,
            total:total,
            totalPages:totalPages,
            hasMore:hasMore
    }
    
}

export default paginatedData;