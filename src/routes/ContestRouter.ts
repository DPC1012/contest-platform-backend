import express, { type Request, type Response } from "express"
import { AuthCheck } from "../middleware/AuthMiddleware";
import { ContestCreationSchema, ContestMcqSchema, ContestMcqSubSchema } from "../validation/ContestSchema";
import { VerifyRole } from "../middleware/RoleCheckMiddleware";
import { prisma } from "../db/db";
const ContestRouter = express.Router();

ContestRouter.post("/", AuthCheck, VerifyRole("creator"), async (req: Request, res: Response) => {
    const { success, data} = ContestCreationSchema.safeParse(req.body);
    if(!success)
    return res.status(400).json({
        success: false,
        data: null,
        error: "INVALID_REQUEST"
    })
    const createContest = await prisma.contest.create({
        data: {
            creatorId: req.userId,
            title: data.title,
            description: data.description,
            startTime: data.startTime,
            endTime: data.endTime
        }
    })
    return res.status(201).json({
        success,
        data: {
            id: createContest.id,
            title: createContest.title,
            creatorId: createContest.creatorId,
            description: createContest.description,
            startTime: createContest.startTime,
            endTime: createContest.endTime
        },
        error: null
    });
})

ContestRouter.get("/:contestId", AuthCheck, async (req: Request,res: Response) => {
    const contestId = Number(req.params.contestId)
    const findContest = await prisma.contest.findUnique({
        where: {
            id: contestId
        },
        include: {
            mcqQue: {
                select: {
                    id: true,
                    questionText: true,
                    options: true,
                    points: true,
                    correctOptionIndex: true
                }
            },
            dsaProb: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    tags: true,
                    points: true,
                    timeLimit: true,
                    memoryLimit: true
                }
            }
        }
    })
    if(!findContest)
    return res.status(404).json({
        success: false,
        data: null,
        error: "CONTEST_NOT_FOUND"
    })
    const mcqResponse = findContest.mcqQue.map((i) => {
        return {
            id: i.id,
            questionText: i.questionText,
            options: i.options,
            points: i.points
            // correctOptionIndex: req.userId == "creator"? i.correctOptionIndex : null,
        }
    })
    const dsaResponse = findContest.dsaProb.map((i) => {
        return {
            id: i.id,
            title: i.title,
            description: i.description,
            tags: i.tags,
            points: i.points,
            timeLimit: i.timeLimit,
            memoryLimit: i.memoryLimit
        }
    })
    return res.json({
        success: true,
        data: {
            id: findContest.id,
            title: findContest.title,
            description: findContest.description,
            startTime: findContest.startTime,
            endTime: findContest.endTime,
            creatorId: findContest.creatorId,
            mcqs: mcqResponse,
            dsaProblems: dsaResponse
        },
        error: null
    })
})

ContestRouter.post("/:contestId/mcq", AuthCheck, VerifyRole("creator"), async (req: Request, res: Response) => {
    const contestId = Number(req.params.contestId);
    const { success, data} = ContestMcqSchema.safeParse(req.body);
    if(!success)
    return res.status(400).json({
        success: false,
        data: null,
        error: "INVALID_REQUEST"
    })
    const findContest = await prisma.contest.findUnique({where: {id: contestId}, include: {mcqQue: true}})
    if(!findContest)
    {
        return res.status(404).json({
            success: false,
            data: null,
            error: "CONTEST_NOT_FOUND"
        })
    }
    const createMcq = await prisma.mcqQuestion.create({
        data: {
            contestId: contestId,
            questionText: data.questionText,
            options: data.options,
            correctOptionIndex: data.correctOptionIndex,
            points: data.points
        }
    })
    return res.status(201).json({
        success,
        data: {
            id: createMcq.id,
            contestId: contestId
        },
        error: null
    })
})

ContestRouter.post("/:contestId/mcq/:questionId/submit", AuthCheck, VerifyRole("contestee"), async(req: Request, res: Response) => {
    const contestId = Number(req.params.contestId);
    const questionId = Number(req.params.questionId);
    const  { success, data} = ContestMcqSubSchema.safeParse(req.body);
    if(!success)
    return res.status(400).json({
        success: false,
        data: null,
        error: "INVALID_REQUEST"
    })
    const findMcq = await prisma.mcqQuestion.findUnique({
        where: {
            id: questionId,
            contestId : questionId
        },
        include: {
            contest: {
                select:{
                    endTime: true,
                }
            },
            mcqSub: {
                select: {
                    submittedAt: true,
                }
            }
        }
    })
    if(!findMcq)
    {
        return res.status(404).json({
            success: false,
            data: null,
            error: "QUESTION_NOT_FOUND"
        })
    }   
    const currTime = new Date();
    if(currTime > findMcq.contest.endTime)
    {
        return res.status(400).json({
            success: false,
            data: null,
            error: "CONTEST_NOT_ACTIVE"
        })
    }
    const isQueSubmitted = findMcq.mcqSub.filter((i) => {
        return {
            submittedAt: i.submittedAt,
        }
    })
})
export default ContestRouter;