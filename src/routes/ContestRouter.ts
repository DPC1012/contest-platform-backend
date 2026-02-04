import express, { type Request, type Response } from "express"
import { AuthCheck } from "../middleware/AuthMiddleware";
import { ContestCreationSchema, ContestDsaSchema, ContestMcqSchema, ContestMcqSubSchema } from "../validation/ContestSchema";
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
    const isQueSubmitted = await prisma.mcqSubmission.findFirst({
        where: {
            questionId: questionId,
            userId: req.userId,
            mcqQue: {
                contestId: contestId,
            }
        }
    })
    if(isQueSubmitted)
    {
        return res.status(400).json({
            success: false,
            data: null,
            error: "ALREADY_SUBMITTED"
        })
    }
    const isQueCorrect = findMcq.correctOptionIndex == data.selectedOptionIndex
    const subMcq = await prisma.mcqSubmission.create({
        data: {
            userId: req.userId,
            questionId: questionId,
            selectedOptionIndex: data.selectedOptionIndex,
            submittedAt: new Date(),
            isCorrect: isQueCorrect ? true : false,
            pointsEarned: isQueCorrect ? 1 : 0,
        }
    })
    return res.status(201).json({
        success,
        data: {
            isCorrect: subMcq.isCorrect,
            pointsEarned: subMcq.pointsEarned
        }
    })
})

ContestRouter.post("/:contesId/dsa", AuthCheck, VerifyRole("creator"), async (req: Request, res: Response) => {
    const contesId = Number(req.params.contesId);
    const { success, data } = ContestDsaSchema.safeParse(req.body);
    if( !success )
    {
        return res.status(400).json({
            success: false,
            data: null,
            error: "INVALID_REQUEST"
        })
    }
    const findContest = await prisma.contest.findUnique({
        where: {
            id: contesId
        },
    })
    if(!findContest)
    {
        return res.status(404).json({
            success: false,
            data: null,
            error: "CONTEST_NOT_FOUND"
        })
    }
    const createDsaProb = await prisma.dsaProblem.create({
        data: {
            title: data.title,
            description: data.description,
            tags: data.tags,
            points: data.points,
            timeLimit: data.timeLimit,
            memoryLimit: data.memoryLimit,
            contestId: contesId,
            createdAt: new Date()
        },
        include: {
            test: true
        }
    })

    const mapTestCases = createDsaProb.test.map((t) => {
        return {
            input: t.input,
            expectedOutput: t.expectedOutput,
            isHidden: t.isHidden
        }
    })

    return res.status(201).json({
        success,
        data: {
            id: createDsaProb.id,
            contesId: contesId
        },
        error: null,
    })
})
export default ContestRouter;