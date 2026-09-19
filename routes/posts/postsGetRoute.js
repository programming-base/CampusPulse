import express from 'express';
import verifyAccessToken from '../../middlewares/verifyAccessToken.js';
import postModel from '../../models/postsSchema/postSchema.js';
import postValidation from '../../middlewares/postValidation.js';
import commentModel from '../../models/postsSchema/commentSchema.js';
const router=express.Router();

router.get('/posts', verifyAccessToken, async (req, res) => {
    try {
        let {
            page = 1,
            limit = 10,
            scope,
            department,
            academicYear
        } = req.query;

        // -----------------------------
        // Pagination
        // -----------------------------
        page = Number(page);
        limit = Number(limit);

        page = page > 0 ? page : 1;
        limit = limit > 0 ? limit : 10;

        const Skip = (page - 1) * limit;

        // -----------------------------
        // Authenticated user's profile
        // -----------------------------
        const user = req.userProfile;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User profile not found'
            });
        }

        // -----------------------------
        // Visibility authorization
        // -----------------------------
        const visibilityFilter = {
            $or: [
                {
                    visibilityScope: 'college',
                    college: user.college
                },
                {
                    visibilityScope: 'department',
                    college: user.college,
                    department: user.department
                },
                {
                    visibilityScope: 'year',
                    college: user.college,
                    department: user.department,
                    academicYear: user.academicYear
                }
            ]
        };

        // -----------------------------
        // Additional client filters
        // -----------------------------
        const filter = {
            $and: [visibilityFilter]
        };

        // scope can narrow the results,
        // but cannot give access to another scope.
        if (scope) {
            const allowedScopes = ['college', 'department', 'year'];

            if (!allowedScopes.includes(scope)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid visibility scope'
                });
            }

            filter.$and.push({
                visibilityScope: scope
            });
        }
        // These filters are validated against the authenticated
        // user's own profile so they cannot be used to access
        // another department/year.
        if (department) {
            if (department !== user.department) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not authorized to access this department'
                });
            }

            filter.$and.push({
                department: user.department
            });
        }

        if (academicYear) {
            const requestedYear = Number(academicYear);

            if (requestedYear !== user.academicYear) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not authorized to access this academic year'
                });
            }

            filter.$and.push({
                academicYear: user.academicYear
            });
        }

        // -----------------------------
        // Get posts
        // -----------------------------
        const posts = await postModel
            .find(filter)
            .skip(Skip)
            .limit(limit);

        // -----------------------------
        // Prepare response
        // -----------------------------
        const postsData = posts.map(post => {
            const postObject = post.toObject();

            if (postObject.isAnonymous) {
                delete postObject.userId;
                delete postObject.userName;
            }

            return postObject;
        });

        // -----------------------------
        // Total count
        // -----------------------------
        const totalCount = await postModel.countDocuments(filter);

        // -----------------------------
        // Response
        // -----------------------------
        const responseJson = {
            items: postsData,
            page: page,
            limit: limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit),

            // Correct pagination check
            hasMore: Skip + postsData.length < totalCount
        };

        return res.status(200).json({
            success: true,
            data: responseJson
        });

    } catch (error) {
        console.error('Error fetching posts:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/posts/:postId/comments',verifyAccessToken,postValidation,async (req,res)=>{
    try{
        const postId=req.post._id;
        let {page=1,limit=10}=req.query;
        if(page) page=Number(page);
        if(limit) limit=Number(limit);
        const skip=(page-1)*limit;
        const paginatedComments=await commentModel.find({postId:postId}).skip(skip).limit(limit).sort({createdAt:-1});
        res.status(200).json(paginatedComments);
    }catch(error){
        return res.status(500).json({error:'Internal server error'})
    }
})
export default router;