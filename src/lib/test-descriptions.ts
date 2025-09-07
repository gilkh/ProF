/* Test descriptions of various lengths for show more/less functionality */

export const testDescriptions = {
  short: "Brief task description.", // 23 chars - should not show toggle
  
  mediumMobile: "This is a medium length description that should trigger show more on mobile devices but might not on desktop.", // 115 chars - should show toggle on mobile (>60) and desktop (>120? no, <120)
  
  mediumDesktop: "This is a longer description that contains more detailed information about the task requirements and should definitely trigger the show more functionality on both mobile and desktop views because it exceeds both thresholds.", // 225 chars - should show toggle on both
  
  veryLong: "This is an extremely long task description that contains extensive details about the requirements, implementation steps, dependencies, deliverables, acceptance criteria, timeline considerations, resource allocations, risk factors, mitigation strategies, quality assurance measures, testing procedures, documentation requirements, stakeholder communications, progress reporting mechanisms, and final approval processes that need to be completed for this particular task.", // 528 chars - should definitely show toggle
  
  edge60: "This description is exactly sixty characters long for testing.", // 60 chars - should not show toggle
  
  edge61: "This description is exactly sixty-one characters long for test.", // 61 chars - should show toggle on mobile
  
  edge120: "This description is designed to be exactly one hundred and twenty characters long to test the desktop threshold perfectly.", // 120 chars - should not show toggle on desktop
  
  edge121: "This description is designed to be exactly one hundred and twenty-one characters long to test the desktop threshold limit.", // 121 chars - should show toggle on desktop
};