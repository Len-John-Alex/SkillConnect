import { useMemo } from 'react';

/**
 * Calculates skill gap between student skills and opportunity requirements
 * @param {Array} studentSkills - Student's skills with proficiency levels
 * @param {Array} opportunitySkills - Opportunity's required skills with proficiency levels
 * @returns {Object} Skill gap analysis
 */
export function useSkillGap(studentSkills = [], opportunitySkills = []) {
  return useMemo(() => {
    // Create lookup maps
    const studentSkillMap = new Map();
    studentSkills.forEach(s => {
      studentSkillMap.set(s.skill_id || s.id, {
        ...s,
        currentProficiency: s.proficiency_level,
      });
    });
    
    const opportunitySkillMap = new Map();
    opportunitySkills.forEach(s => {
      const skillId = s.skill_id || s.id;
      opportunitySkillMap.set(skillId, {
        ...s,
        skill_id: skillId,
        requiredProficiency: s.required_proficiency,
        importance: s.importance,
      });
    });
    
    // Analyze each required skill
    const matched = [];
    const needsImprovement = [];
    const missing = [];
    
    opportunitySkillMap.forEach((req, skillId) => {
      const studentSkill = studentSkillMap.get(skillId);
      
      if (!studentSkill) {
        missing.push({
          ...req,
          gap: req.requiredProficiency,
          gapLevel: 'missing',
        });
      } else {
        const current = studentSkill.currentProficiency;
        const required = req.requiredProficiency;
        const gap = required - current;
        
        if (gap <= 0) {
          matched.push({
            ...req,
            ...studentSkill,
            gap: 0,
            gapLevel: 'met',
          });
        } else {
          needsImprovement.push({
            ...req,
            ...studentSkill,
            gap,
            gapLevel: gap <= 1 ? 'close' : gap <= 2 ? 'moderate' : 'significant',
          });
        }
      }
    });
    
    // Calculate summary
    const totalRequired = opportunitySkills.length;
    const metCount = matched.length;
    const needsCount = needsImprovement.length;
    const missingCount = missing.length;
    const matchPercentage = totalRequired > 0 ? Math.round((metCount / totalRequired) * 100) : 100;
    
    // Overall readiness
    let readiness = 'ready';
    if (missingCount > 0) readiness = 'not-ready';
    else if (needsCount > 0) readiness = 'partial';
    
    return {
      matched,
      needsImprovement,
      missing,
      summary: {
        totalRequired,
        metCount,
        needsCount,
        missingCount,
        matchPercentage,
        readiness,
      },
    };
  }, [studentSkills, opportunitySkills]);
}

/**
 * Gets learning resource recommendations for skill gaps
 * @param {Array} missingSkills - Skills that are missing or need improvement
 * @param {Array} allResources - All available learning resources
 * @returns {Array} Recommended resources
 */
export function useLearningRecommendations(missingSkills = [], allResources = []) {
  return useMemo(() => {
    const missingSkillIds = new Set(missingSkills.map(s => s.skill_id || s.id).filter(Boolean));
    
    return allResources
      .filter(r => missingSkillIds.has(r.skill_id || r.id))
      .sort((a, b) => {
        // Prioritize by resource type (courses first)
        const typeOrder = { course: 0, video: 1, article: 2, book: 3, tool: 4, other: 5 };
        return (typeOrder[a.resource_type] || 5) - (typeOrder[b.resource_type] || 5);
      });
  }, [missingSkills, allResources]);
}