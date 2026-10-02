const express = require("express");

const router = express.Router();

const db = require("../config/db");

const {
    coordinatorAgent
} = require("../agents/coordinatorAgent");

const {
    askLLM
} = require("../ai_service/ollamaClient");


/* =========================================================
   HELPER: Extract numbered / bullet items from AI output
========================================================= */

function extractItems(text) {

    if (!text) return [];

    return String(text)
        .split("\n")
        .map(line =>
            line
                .replace(/^\s*[-*•]\s*/, "")
                .replace(/^\s*\d+[\.\)]\s*/, "")
                .trim()
        )
        .filter(Boolean);
}


/* =========================================================
   HELPER: Clean task text
========================================================= */

function cleanTaskText(text) {

    if (!text) return "";

    return String(text)
        .replace(/\*\*/g, "")
        .replace(/`/g, "")
        .replace(/^Task\s*:\s*/i, "")
        .replace(/^Action\s*:\s*/i, "")
        .replace(/^Immediate next step\s*:\s*/i, "")
        .replace(/^Next step\s*:\s*/i, "")
        .replace(/\s+/g, " ")
        .trim();
}


/* =========================================================
   HELPER: Extract owner if available
========================================================= */

function extractOwner(task) {

    if (!task) return null;

    const patterns = [
        /\bOwner\s*:\s*([A-Za-z][A-Za-z .'-]+)/i,
        /\bAssigned to\s*:\s*([A-Za-z][A-Za-z .'-]+)/i,
        /\bAssignee\s*:\s*([A-Za-z][A-Za-z .'-]+)/i
    ];

    for (const pattern of patterns) {

        const match = task.match(pattern);

        if (match && match[1]) {
            return match[1].trim();
        }
    }

    return null;
}


/* =========================================================
   HELPER: Determine priority
========================================================= */

function determinePriority(task) {

    const text =
        String(task || "").toLowerCase();

    if (
        text.includes("critical") ||
        text.includes("urgent") ||
        text.includes("security vulnerability") ||
        text.includes("production blocker")
    ) {
        return "Critical";
    }

    if (
        text.includes("high priority") ||
        text.includes("high-priority") ||
        text.includes("important") ||
        text.includes("immediately") ||
        text.includes("authentication") ||
        text.includes("security")
    ) {
        return "High";
    }

    if (
        text.includes("low priority") ||
        text.includes("low-priority")
    ) {
        return "Low";
    }

    return "Medium";
}


/* =========================================================
   HELPER: Check if task is actionable
========================================================= */

function isActionableTask(task) {

    if (!task) return false;

    const text =
        String(task).toLowerCase().trim();

    if (text.length < 10) {
        return false;
    }

    const genericPatterns = [
        /^discuss\b/,
        /^review the meeting\b/,
        /^continue discussion\b/,
        /^monitor\b/,
        /^keep track\b/,
        /^consider\b/,
        /^think about\b/,
        /^be aware\b/,
        /^note that\b/,
        /^understand\b/,
        /^ensure everyone\b/,
        /^communicate\b$/
    ];

    for (const pattern of genericPatterns) {

        if (pattern.test(text)) {
            return false;
        }
    }

    const actionWords = [
        "create",
        "build",
        "implement",
        "develop",
        "configure",
        "setup",
        "set up",
        "initialize",
        "integrate",
        "design",
        "test",
        "deploy",
        "fix",
        "update",
        "add",
        "remove",
        "connect",
        "install",
        "prepare",
        "write",
        "complete",
        "define",
        "validate",
        "verify"
    ];

    return actionWords.some(word =>
        text.includes(word)
    );
}


/* =========================================================
   HELPER: Normalize task title
========================================================= */

function normalizeTaskTitle(text) {

    return String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}


/* =========================================================
   HELPER: Clean JSON returned by LLM
========================================================= */

function cleanAIJsonResponse(text) {

    if (!text) return "";

    let cleaned =
        String(text).trim();

    cleaned = cleaned
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

    const firstBrace =
        cleaned.indexOf("{");

    const lastBrace =
        cleaned.lastIndexOf("}");

    if (
        firstBrace !== -1 &&
        lastBrace !== -1
    ) {
        cleaned =
            cleaned.substring(
                firstBrace,
                lastBrace + 1
            );
    }

    return cleaned;
}


/* =========================================================
   HELPER: Stop words for similarity validation
========================================================= */

const STOP_WORDS = new Set([
    "the",
    "and",
    "for",
    "with",
    "from",
    "this",
    "that",
    "into",
    "will",
    "need",
    "required",
    "project",
    "task",
    "create",
    "setup",
    "set",
    "up",
    "implement",
    "develop",
    "build",
    "add",
    "make",
    "using",
    "use",
    "ensure",
    "provide",
    "should",
    "must",
    "have",
    "has",
    "are",
    "was",
    "were",
    "is",
    "to",
    "of",
    "in",
    "on",
    "a",
    "an",
    "as",
    "by",
    "be"
]);


/* =========================================================
   HELPER: Extract meaningful words
========================================================= */

function getMeaningfulWords(text) {

    return String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(word =>
            word.length > 3 &&
            !STOP_WORDS.has(word)
        );
}


/* =========================================================
   HELPER: Detect if AI reason repeats task
========================================================= */

function reasonRepeatsTask(task, reason) {

    const taskWords =
        getMeaningfulWords(task);

    const reasonWords =
        getMeaningfulWords(reason);

    if (
        taskWords.length === 0 ||
        reasonWords.length === 0
    ) {
        return false;
    }

    const taskSet =
        new Set(taskWords);

    const overlap =
        reasonWords.filter(word =>
            taskSet.has(word)
        );

    const overlapRatio =
        overlap.length /
        Math.max(1, taskWords.length);

    return overlapRatio >= 0.5;
}


/* =========================================================
   HELPER: Normalize AI reason
========================================================= */

function normalizeReason(reason) {

    return String(reason || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}


/* =========================================================
   GENERATE AI REASONS
========================================================= */

async function generateAIReasons(
    meetingNotes,
    tasks
) {

    if (
        !tasks ||
        tasks.length === 0
    ) {
        return {};
    }

    const prompt = `
You are an AI project management assistant.

Your job is to explain WHY each proposed task is necessary based ONLY on the meeting notes.

MEETING NOTES:

${meetingNotes}

PROPOSED TASKS:

${tasks
    .map(
        (task, index) =>
            `${index + 1}. ${task}`
    )
    .join("\n")}

IMPORTANT RULES:

1. Generate exactly ONE reason for EVERY task.

2. Each reason MUST be different.

3. Explain WHY the project needs the task.

4. DO NOT repeat the task title.

5. DO NOT paraphrase the task title.

6. DO NOT describe WHAT the task does.

7. DO NOT simply convert the task into another sentence.

8. DO NOT mention the task title inside the reason.

9. Base the reason on the meeting context.

10. Prefer specific project evidence such as:
- dependencies
- security requirements
- blockers
- milestones
- deadlines
- risks
- decisions
- integration requirements
- business requirements
- technical constraints

11. If the task involves database work, explain the project's need for reliable persistent data and how it supports later features.

12. If the task involves authentication, explain the access-control or security requirement.

13. If the task involves testing, explain the quality, reliability, or risk requirement.

14. If the task involves deployment, explain the delivery milestone or production requirement.

15. If the task involves API development, explain which project functionality depends on the API.

16. If the task involves UI development, explain which user workflow or requirement depends on it.

17. NEVER use generic sentences such as:
"This task is important for the project."
"This is required for the project."
"This will help the project progress."
"This actionable task was identified from the meeting."
"This task is necessary."
"This will improve the project."

18. Do not repeat the same reasoning pattern for multiple tasks.

19. Each reason must contain meaningful project context.

20. Each reason should be between 15 and 30 words.

21. Use professional natural language.

22. Do not use markdown.

23. Return ONLY valid JSON.

Return exactly:

{
  "reasons": [
    {
      "task": "exact task title",
      "reason": "specific explanation of why this task is needed based on the meeting context"
    }
  ]
}
`;

    try {

        const response =
            await askLLM(prompt);

        const cleaned =
            cleanAIJsonResponse(response);

        const parsed =
            JSON.parse(cleaned);

        if (
            !parsed ||
            !Array.isArray(parsed.reasons)
        ) {
            throw new Error(
                "Invalid AI reason response format"
            );
        }

        const reasonMap = {};

        const usedReasons =
            new Set();

        for (
            const item of parsed.reasons
        ) {

            if (
                !item ||
                !item.task ||
                !item.reason
            ) {
                continue;
            }

            const task =
                cleanTaskText(item.task);

            const reason =
                String(item.reason)
                    .replace(/\s+/g, " ")
                    .trim();

            if (!reason) {
                continue;
            }

            /*
              Reject reasons that simply
              repeat the task.
            */

            if (
                reasonRepeatsTask(
                    task,
                    reason
                )
            ) {

                console.log(
                    "⚠️ Skipping repetitive AI reason:",
                    reason
                );

                continue;
            }

            /*
              Prevent duplicate reasons.
            */

            const reasonKey =
                normalizeReason(reason);

            if (
                usedReasons.has(reasonKey)
            ) {

                console.log(
                    "⚠️ Skipping duplicate AI reason:",
                    reason
                );

                continue;
            }

            usedReasons.add(reasonKey);

            const taskKey =
                normalizeTaskTitle(task);

            reasonMap[taskKey] =
                reason;
        }

        return reasonMap;

    } catch (error) {

        console.error(
            "AI REASON GENERATION ERROR:",
            error.message
        );

        return {};
    }
}


/* =========================================================
   CREATE AI RECOMMENDATIONS
========================================================= */

async function createRecommendations(
    meetingId,
    meetingNotes,
    insights
) {

    try {

        if (!insights) {

            console.log(
                "⚠️ No AI insights available for recommendations"
            );

            return [];
        }

        /*
          Only TASKS become recommendations.

          Risks, reminders, decisions and timeline
          remain inside AI Project Intelligence.
        */

        let rawTasks = [];

        if (
            Array.isArray(insights.tasks)
        ) {

            rawTasks =
                insights.tasks;

        } else if (
            typeof insights.tasks === "string"
        ) {

            rawTasks =
                extractItems(
                    insights.tasks
                );
        }

        /*
          Clean and filter tasks.
        */

        let tasks =
            rawTasks
                .map(task =>
                    cleanTaskText(task)
                )
                .filter(Boolean)
                .filter(isActionableTask);

        /*
          Remove duplicate tasks.
        */

        const seenTasks =
            new Set();

        tasks =
            tasks.filter(task => {

                const key =
                    normalizeTaskTitle(task);

                if (!key) {
                    return false;
                }

                if (
                    seenTasks.has(key)
                ) {
                    return false;
                }

                seenTasks.add(key);

                return true;
            });

        /*
          Maximum 6 recommendations.
        */

        tasks =
            tasks.slice(0, 6);

        if (
            tasks.length === 0
        ) {

            console.log(
                "ℹ️ No actionable tasks found for recommendations"
            );

            return [];
        }

        console.log(
            `🤖 Generating AI reasons for ${tasks.length} recommendations...`
        );

        /*
          One Groq call for all reasons.
        */

        const reasonMap =
            await generateAIReasons(
                meetingNotes,
                tasks
            );

        const insertedIds = [];

        /*
          Insert recommendations.
        */

        for (
            const task of tasks
        ) {

            const title =
                cleanTaskText(task);

            if (!title) {
                continue;
            }

            const taskKey =
                normalizeTaskTitle(title);

            const aiReason =
                reasonMap[taskKey] || null;

            const owner =
                extractOwner(title);

            const priority =
                determinePriority(title);

            const sql = `
                INSERT INTO ai_recommendations
                (
                    project_id,
                    meeting_id,
                    type,
                    title,
                    description,
                    owner,
                    priority,
                    due_date,
                    ai_reason,
                    status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
            `;

            const values = [
                null,
                meetingId,
                "task",
                title,
                title,
                owner,
                priority,
                null,
                aiReason
            ];

            await new Promise(
                (resolve, reject) => {

                    db.query(
                        sql,
                        values,
                        (
                            error,
                            result
                        ) => {

                            if (error) {

                                console.error(
                                    "CREATE RECOMMENDATION ERROR:",
                                    error
                                );

                                reject(error);
                                return;
                            }

                            insertedIds.push(
                                result.insertId
                            );

                            resolve();
                        }
                    );

                }
            );
        }

        console.log(
            `✅ ${insertedIds.length} AI recommendations created`
        );

        return insertedIds;

    } catch (error) {

        console.error(
            "CREATE RECOMMENDATIONS ERROR:",
            error
        );

        return [];
    }
}


/* =========================================================
   GET ALL MEETINGS
========================================================= */

router.get(
    "/",
    (req, res) => {

        const sql = `
            SELECT
                id,
                title,
                notes,
                created_at
            FROM meetings
            ORDER BY created_at DESC
        `;

        db.query(
            sql,
            (error, rows) => {

                if (error) {

                    console.error(
                        "GET MEETINGS ERROR:",
                        error
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Failed to fetch meetings",
                        error:
                            error.message
                    });
                }

                return res.status(200).json({

                    success: true,

                    meetings:
                        rows

                });
            }
        );
    }
);


/* =========================================================
   CREATE / ANALYZE MEETING
========================================================= */

router.post(
    "/",
    async (req, res) => {

        try {

            const {
                title,
                notes
            } = req.body;

            /*
              Validate input.
            */

            if (
                !title ||
                !String(title).trim()
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Meeting title is required"

                });
            }

            if (
                !notes ||
                !String(notes).trim()
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Meeting notes are required"

                });
            }

            /*
              Insert meeting.
            */

            const meetingId =
                await new Promise(
                    (resolve, reject) => {

                        const sql = `
                            INSERT INTO meetings
                            (
                                title,
                                notes
                            )
                            VALUES (?, ?)
                        `;

                        db.query(
                            sql,
                            [
                                String(title).trim(),
                                String(notes).trim()
                            ],
                            (
                                error,
                                result
                            ) => {

                                if (error) {

                                    reject(error);
                                    return;
                                }

                                resolve(
                                    result.insertId
                                );
                            }
                        );

                    }
                );

            console.log(
                `✅ Meeting created: ${meetingId}`
            );

            /*
              IMPORTANT FIX:
              Your coordinatorAgent.js exports:

              module.exports = {
                  coordinatorAgent
              }

              Therefore call coordinatorAgent()
              directly.
            */

            const insights =
                await coordinatorAgent(
                    String(notes).trim()
                );

            /*
              Save AI insights.
            */

            await new Promise(
                (resolve, reject) => {

                    const sql = `
                        INSERT INTO meeting_insights
                        (
                            meeting_id,
                            summary,
                            tasks,
                            reminders,
                            risks,
                            timeline,
                            decisions
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `;

                    const values = [

                        meetingId,

                        insights?.summary || "",

                        JSON.stringify(
                            insights?.tasks || []
                        ),

                        JSON.stringify(
                            insights?.reminders || []
                        ),

                        JSON.stringify(
                            insights?.risks || []
                        ),

                        JSON.stringify(
                            insights?.timeline || []
                        ),

                        JSON.stringify(
                            insights?.decisions || []
                        )

                    ];

                    db.query(
                        sql,
                        values,
                        error => {

                            if (error) {

                                console.error(
                                    "SAVE MEETING INSIGHTS ERROR:",
                                    error
                                );

                                reject(error);
                                return;
                            }

                            resolve();
                        }
                    );

                }
            );

            /*
              Create ONLY actionable task
              recommendations.

              Maximum = 6.
              Status = pending.
            */

            const recommendationIds =
                await createRecommendations(
                    meetingId,
                    String(notes).trim(),
                    insights
                );

            /*
              Final response.
            */

            return res.status(201).json({

                success: true,

                message:
                    "Meeting analyzed successfully",

                meeting_id:
                    meetingId,

                insights,

                recommendations: {

                    count:
                        recommendationIds.length,

                    ids:
                        recommendationIds,

                    status:
                        "pending"

                }

            });

        } catch (error) {

            console.error(
                "MEETING ANALYSIS ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error?.message ||
                    "Failed to analyze meeting"

            });
        }
    }
);


/* =========================================================
   GET MEETING INSIGHTS
========================================================= */

router.get(
    "/insights/:meetingId",
    (req, res) => {

        const meetingId =
            req.params.meetingId;

        const sql = `
            SELECT
                id,
                meeting_id,
                summary,
                tasks,
                reminders,
                risks,
                timeline,
                decisions,
                created_at
            FROM meeting_insights
            WHERE meeting_id = ?
            ORDER BY created_at DESC
            LIMIT 1
        `;

        db.query(
            sql,
            [meetingId],
            (error, rows) => {

                if (error) {

                    console.error(
                        "GET MEETING INSIGHTS ERROR:",
                        error
                    );

                    return res.status(500).json({

                        success: false,

                        message:
                            "Failed to fetch meeting insights",

                        error:
                            error.message

                    });
                }

                if (
                    rows.length === 0
                ) {

                    return res.status(404).json({

                        success: false,

                        message:
                            "Meeting insights not found"

                    });
                }

                const row =
                    rows[0];

                /*
                  Safely parse JSON fields.
                */

                const parseJSON =
                    value => {

                        if (!value) {
                            return [];
                        }

                        if (
                            Array.isArray(value)
                        ) {
                            return value;
                        }

                        try {

                            return JSON.parse(
                                value
                            );

                        } catch {

                            return value;
                        }
                    };

                return res.status(200).json({

                    success: true,

                    insights: {

                        summary:
                            row.summary,

                        tasks:
                            parseJSON(
                                row.tasks
                            ),

                        reminders:
                            parseJSON(
                                row.reminders
                            ),

                        risks:
                            parseJSON(
                                row.risks
                            ),

                        timeline:
                            parseJSON(
                                row.timeline
                            ),

                        decisions:
                            parseJSON(
                                row.decisions
                            )

                    }

                });
            }
        );
    }
);


/* =========================================================
   DELETE MEETING
========================================================= */

router.delete(
    "/:id",
    (req, res) => {

        const meetingId =
            req.params.id;

        /*
          Delete recommendations first.
        */

        db.query(
            `
                DELETE FROM ai_recommendations
                WHERE meeting_id = ?
            `,
            [meetingId],
            recommendationError => {

                if (recommendationError) {

                    console.error(
                        "DELETE RECOMMENDATIONS ERROR:",
                        recommendationError
                    );

                    return res.status(500).json({

                        success: false,

                        message:
                            "Failed to delete meeting recommendations",

                        error:
                            recommendationError.message

                    });
                }

                /*
                  Delete insights.
                */

                db.query(
                    `
                        DELETE FROM meeting_insights
                        WHERE meeting_id = ?
                    `,
                    [meetingId],
                    insightError => {

                        if (insightError) {

                            console.error(
                                "DELETE INSIGHTS ERROR:",
                                insightError
                            );

                            return res.status(500).json({

                                success: false,

                                message:
                                    "Failed to delete meeting insights",

                                error:
                                    insightError.message

                            });
                        }

                        /*
                          Delete meeting.
                        */

                        db.query(
                            `
                                DELETE FROM meetings
                                WHERE id = ?
                            `,
                            [meetingId],
                            (
                                meetingError,
                                result
                            ) => {

                                if (meetingError) {

                                    console.error(
                                        "DELETE MEETING ERROR:",
                                        meetingError
                                    );

                                    return res.status(500).json({

                                        success: false,

                                        message:
                                            "Failed to delete meeting",

                                        error:
                                            meetingError.message

                                    });
                                }

                                if (
                                    result.affectedRows === 0
                                ) {

                                    return res.status(404).json({

                                        success: false,

                                        message:
                                            "Meeting not found"

                                    });
                                }

                                return res.status(200).json({

                                    success: true,

                                    message:
                                        "Meeting and related data deleted successfully",

                                    meeting_id:
                                        Number(meetingId)

                                });
                            }
                        );
                    }
                );
            }
        );
    }
);


module.exports = router;