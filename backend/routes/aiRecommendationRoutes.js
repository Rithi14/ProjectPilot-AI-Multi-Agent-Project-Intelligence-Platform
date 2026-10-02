const express = require("express");
const router = express.Router();

const db = require("../config/db");

/*
====================================================
SETTINGS
====================================================
Maximum number of recommendations kept for ONE meeting.
6-8 is a reviewable amount for a human approver.
*/
const MAX_RECOMMENDATIONS_PER_MEETING = 8;

const SELECT_FIELDS = `
  id,
  project_id,
  meeting_id,
  type,
  title,
  description,
  owner,
  priority,
  due_date,
  ai_reason,
  status,
  rejection_reason,
  created_at,
  updated_at
`;

/*
====================================================
1. CREATE AI RECOMMENDATION
POST /ai/recommendations
====================================================
- Skips duplicates (same title for the same meeting)
- Stops after MAX_RECOMMENDATIONS_PER_MEETING per meeting
*/

router.post("/", (req, res) => {
  try {
    const {
      project_id,
      meeting_id,
      type,
      title,
      description,
      owner,
      priority,
      due_date,
      ai_reason,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Recommendation title is required",
      });
    }

    const cleanTitle = title.trim();

    const insertRecommendation = () => {
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
          ai_reason
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        project_id || null,
        meeting_id || null,
        type || "task",
        cleanTitle,
        description || null,
        owner || null,
        priority || "Medium",
        due_date || null,
        ai_reason || null,
      ];

      db.query(sql, values, (error, result) => {
        if (error) {
          console.error("CREATE RECOMMENDATION ERROR:", error);

          return res.status(500).json({
            success: false,
            message: "Failed to create AI recommendation",
            error: error.message,
          });
        }

        return res.status(201).json({
          success: true,
          message: "AI recommendation created successfully",
          recommendation_id: result.insertId,
        });
      });
    };

    // Without a meeting there is nothing to compare against
    if (!meeting_id) {
      return insertRecommendation();
    }

    const checkSql = `
      SELECT
        COUNT(*) AS total,
        COALESCE(SUM(LOWER(TRIM(title)) = LOWER(?)), 0) AS duplicates
      FROM ai_recommendations
      WHERE meeting_id = ?
    `;

    db.query(checkSql, [cleanTitle, meeting_id], (checkError, rows) => {
      if (checkError) {
        console.error("CHECK RECOMMENDATION ERROR:", checkError);

        return res.status(500).json({
          success: false,
          message: "Failed to create AI recommendation",
          error: checkError.message,
        });
      }

      const total = Number(rows[0]?.total || 0);
      const duplicates = Number(rows[0]?.duplicates || 0);

      if (duplicates > 0) {
        return res.status(200).json({
          success: true,
          skipped: true,
          message: "Duplicate recommendation skipped",
        });
      }

      if (total >= MAX_RECOMMENDATIONS_PER_MEETING) {
        return res.status(200).json({
          success: true,
          skipped: true,
          message: `Limit of ${MAX_RECOMMENDATIONS_PER_MEETING} recommendations per meeting reached`,
        });
      }

      return insertRecommendation();
    });
  } catch (error) {
    console.error("CREATE RECOMMENDATION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create AI recommendation",
      error: error.message,
    });
  }
});


/*
====================================================
2. GET PENDING AI RECOMMENDATIONS
GET /ai/recommendations
Optional query params:
  ?meeting_id=12   only that meeting
  ?limit=8         max rows (1-50)
====================================================
High priority first, then newest.
*/

router.get("/", (req, res) => {
  const conditions = ["status = 'pending'"];
  const params = [];

  if (req.query.meeting_id) {
    conditions.push("meeting_id = ?");
    params.push(req.query.meeting_id);
  }

  let limitSql = "";

  if (req.query.limit) {
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 1, 1),
      50
    );

    limitSql = "LIMIT ?";
    params.push(limit);
  }

  const sql = `
    SELECT ${SELECT_FIELDS}
    FROM ai_recommendations
    WHERE ${conditions.join(" AND ")}
    ORDER BY
      FIELD(priority, 'High', 'Medium', 'Low'),
      created_at DESC
    ${limitSql}
  `;

  db.query(sql, params, (error, rows) => {
    if (error) {
      console.error("GET RECOMMENDATIONS ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch AI recommendations",
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      count: rows.length,
      recommendations: rows,
    });
  });
});


/*
====================================================
3. APPROVE AI RECOMMENDATION
PATCH /ai/recommendations/:id/approve
====================================================
*/

router.patch("/:id/approve", (req, res) => {
  const recommendationId = req.params.id;

  const sql = `
    UPDATE ai_recommendations
    SET
      status = 'approved',
      rejection_reason = NULL
    WHERE id = ?
      AND status = 'pending'
  `;

  db.query(sql, [recommendationId], (error, result) => {
    if (error) {
      console.error("APPROVE RECOMMENDATION ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to approve recommendation",
        error: error.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Recommendation not found or already processed",
      });
    }

    return res.status(200).json({
      success: true,
      message: "AI recommendation approved successfully",
      recommendation_id: Number(recommendationId),
      status: "approved",
    });
  });
});


/*
====================================================
4. REJECT AI RECOMMENDATION
PATCH /ai/recommendations/:id/reject
====================================================
*/

router.patch("/:id/reject", (req, res) => {
  const recommendationId = req.params.id;

  const rejectionReason =
    req.body?.rejection_reason || "Rejected by student";

  const sql = `
    UPDATE ai_recommendations
    SET
      status = 'rejected',
      rejection_reason = ?
    WHERE id = ?
      AND status = 'pending'
  `;

  db.query(sql, [rejectionReason, recommendationId], (error, result) => {
    if (error) {
      console.error("REJECT RECOMMENDATION ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to reject recommendation",
        error: error.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Recommendation not found or already processed",
      });
    }

    return res.status(200).json({
      success: true,
      message: "AI recommendation rejected successfully",
      recommendation_id: Number(recommendationId),
      status: "rejected",
      rejection_reason: rejectionReason,
    });
  });
});


/*
====================================================
5. GET SINGLE RECOMMENDATION
GET /ai/recommendations/:id
====================================================
*/

router.get("/:id", (req, res) => {
  const recommendationId = req.params.id;

  const sql = `
    SELECT ${SELECT_FIELDS}
    FROM ai_recommendations
    WHERE id = ?
  `;

  db.query(sql, [recommendationId], (error, rows) => {
    if (error) {
      console.error("GET SINGLE RECOMMENDATION ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch recommendation",
        error: error.message,
      });
    }

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Recommendation not found",
      });
    }

    return res.status(200).json({
      success: true,
      recommendation: rows[0],
    });
  });
});


/*
====================================================
EXPORT ROUTER
====================================================
*/

module.exports = router;