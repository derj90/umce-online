library(shiny)

# an array giving data to use on pages per hour according to difficulty, reading purpose, and reading density
pagesperhour <- array(
  data<-c(67,47, 33, 33, 24, 17, 17, 12, 9, 50, 35, 25, 25, 18, 13, 13, 9, 7, 40, 28, 20, 20, 14, 10, 10, 7, 5), 
  dim=c(3,3,3),
  dimnames = list(c("No New Concepts","Some New Concepts","Many New Concepts"), 
                  c("Survey","Learn","Engage"),
                  c("450 Words (Paperback)","600 Words (Monograph)","750 Words (Textbook)")
                )
)

# an array giving data to use on hours per page according to difficulty, reading purpose, and reading density
hoursperwriting <- array(
  data<-c(0.75, 1.5, 1, 2, 1.25, 2.5, 1.5, 3, 2, 4, 2.5, 5, 3, 6, 4, 8, 5, 10),
  dim=c(2,3,3),
  dimnames = list(c("250 Words (D-Spaced)", "500 Words (S-Spaced)"),
                  c("No Drafting", "Minimal Drafting", "Extensive Drafting"),
                  c("Reflection; Narrative", "Argument", "Research")
                  )
)


# Define server logic
shinyServer(
  
    function(input, output){

    # calculate the total estimated workload in hours per week
    output$estimatedworkload <- renderText({
      
      # set reading rate in pages per hour
      # if user has not opted to manually input a value...
      if(input$setreadingrate==F){
        # use the values in the pagesperhour array above to select a reading rate
        pagesperhour.sel <- pagesperhour[as.numeric(input$difficulty), as.numeric(input$readingpurpose), as.numeric(input$readingdensity)]
      }else{
        # if user selects manual override, use the manually input value
        pagesperhour.sel <- input$overridepagesperhour
      }
      
      # set writing rate in hours per page
      # if user has not opted to manually input a value...
      if(input$setwritingrate==F){
        # use the values in the hoursperwriting array above to select a writing rate
        hoursperwriting.sel <- hoursperwriting[as.numeric(input$writtendensity), as.numeric(input$draftrevise), as.numeric(input$writingpurpose)]
      }else{
        # if user selects manual override, use the manually input value
        hoursperwriting.sel <- input$overridehoursperwriting 
      }
      
      # determine correct value to use for discussion post hours
      if(input$setdiscussion==F){
        if(input$postformat==1){ # text estimate
          posthours.sel <- ((as.numeric(input$postlength.text)*as.numeric(input$postsperweek))/250)
        }
        if(input$postformat==2){ # audio/video estimate
          posthours.sel <- 0.18*((as.numeric(input$postlength.av)*as.numeric(input$postsperweek)))+((as.numeric(input$postlength.av)*as.numeric(input$postsperweek))/6)
        }}else{
          posthours.sel <- input$overridediscussion
        }
      
      # determine if exam time needs to be added
      if(input$takehome==T){
        takehome.sel <- as.numeric(input$exam.length)
      }else{takehome.sel <- 0}
      
      # calculate hours spent working using inputted values from UI
      expr = paste("Total: ", round(
                    (as.numeric(input$weeklypages)/as.numeric(pagesperhour.sel)) + 
                    ( (as.numeric(hoursperwriting.sel)*as.numeric(input$semesterpages)) / as.numeric(input$classweeks) ) +
                    ( (as.numeric(input$exams)*as.numeric(input$examhours)) / as.numeric(input$classweeks)) +
                    ( (as.numeric(input$otherassign)*as.numeric(input$otherhours)) / as.numeric(input$classweeks) ) +
                      (as.numeric(posthours.sel) ) +
                      (as.numeric(input$weeklyvideos) ) +
                    ( (as.numeric(takehome.sel) / 60 ) * as.numeric(input$exams) / as.numeric(input$classweeks) ) +
                    ( (as.numeric(input$syncsessions) * as.numeric(input$synclength)) ), 
                  digits=2),"hrs/wk")
      
    })
    
    # calculate the out-of-class/independent workload in hours per week
    output$estimatedoutofclass<- renderText({
      
      # set reading rate in pages per hour
      # if user has not opted to manually input a value...
      if(input$setreadingrate==F){
        # use the values in the pagesperhour array above to select a reading rate
        pagesperhour.sel <- pagesperhour[as.numeric(input$difficulty), as.numeric(input$readingpurpose), as.numeric(input$readingdensity)]
      }else{
        # if user selects manual override, use the manually input value
        pagesperhour.sel <- input$overridepagesperhour
      }
      
      # set writing rate in hours per page
      # if user has not opted to manually input a value...
      if(input$setwritingrate==F){
        # use the values in the hoursperwriting array above to select a writing rate
        hoursperwriting.sel <- hoursperwriting[as.numeric(input$writtendensity), as.numeric(input$draftrevise), as.numeric(input$writingpurpose)]
      }else{
        # if user selects manual override, use the manually input value
        hoursperwriting.sel <- input$overridehoursperwriting 
      }
      
      # determine correct value to use for discussion post hours
      if(input$setdiscussion==F){
        if(input$postformat==1){ # text estimate
          posthours.sel <- ((as.numeric(input$postlength.text)*as.numeric(input$postsperweek))/250)
        }
        if(input$postformat==2){ # audio/video estimate
          posthours.sel <- ((as.numeric(input$postlength.av)*as.numeric(input$postsperweek))/3)
        }}else{
          posthours.sel <- input$overridediscussion
        }
      
      
      # determine if exam time needs to be added
      if(input$takehome==T){
        takehome.sel <- as.numeric(input$exam.length)
      }else{takehome.sel <- 0}
      
      # should we include other assignments?
      if(input$other.engage==F){
        other.sel <- as.numeric(input$otherassign) * (input$otherhours)
      }else{other.sel <- 0}
      
      # calculate hours spent working out of class per week using inputted values from UI
      expr = paste("Independent: ", round(
        
        (as.numeric(input$weeklypages)/as.numeric(pagesperhour.sel)) + 
          ( (as.numeric(hoursperwriting.sel)*as.numeric(input$semesterpages)) / as.numeric(input$classweeks) ) +
          ( (as.numeric(input$exams)*as.numeric(input$examhours)) / as.numeric(input$classweeks)) +
          # (as.numeric(posthours.sel) ) +
          (as.numeric(input$weeklyvideos) ) +
          (as.numeric(other.sel))/(as.numeric(input$classweeks)) +
          ( (as.numeric(takehome.sel) / 60 ) * as.numeric(input$exams) / as.numeric(input$classweeks) ),
        
        digits=2),"hrs/wk")
      
    })
    

    # calculate engagement time in hours per week
    output$estimatedengaged <- renderText({
      
      # should we include other assignments?
      if(input$other.engage==T){
        other.sel <- as.numeric(input$otherassign) * (input$otherhours)
      }else{other.sel <- 0}
      
      # determine correct value to use for discussion post hours
      if(input$setdiscussion==F){
        if(input$postformat==1){ # text estimate
          posthours.sel <- ((as.numeric(input$postlength.text)*as.numeric(input$postsperweek))/250)
        }
        if(input$postformat==2){ # audio/video estimate
          posthours.sel <- ((as.numeric(input$postlength.av)*as.numeric(input$postsperweek))/3)
        }}else{
          posthours.sel <- input$overridediscussion
        }
      
      # calculate hours engaged w/ instructor using inputted values from UI
      expr = paste("Contact: ", round(
        
          (as.numeric(posthours.sel) ) +
          ( (as.numeric(input$syncsessions) * as.numeric(input$synclength)) ) +
          (as.numeric(other.sel))/(as.numeric(input$classweeks)),
        
        digits=2),"hrs/wk")
      
    })
    
        
    # generate an estimate for hours per week spent on Discussion Posts
    output$hoursperposts.out <- renderText({
      
    # determine correct value to use for discussion post hours
      if(input$postformat==1){ # text estimate
        posthours.sel <- ((as.numeric(input$postlength.text)*as.numeric(input$postsperweek))/250)
      }
      if(input$postformat==2){ # audio/video estimate
        posthours.sel <- ((as.numeric(input$postlength.av)*as.numeric(input$postsperweek))/3)
      }
      
      # calculate hours spent on discussion posts using inputted values from UI
      expr = paste(round(
        as.numeric(posthours.sel), 
        digits=2),"hours / week")      
        
    })
    
    # generate a displayable value for the reading rate used from the pagesperhour matrix
    output$pagesperhour.out <- renderText({
      
      expr = paste(pagesperhour[
        as.numeric(input$difficulty), as.numeric(input$readingpurpose), as.numeric(input$readingdensity)
        ], "pages per hour")
      
    })
    
    # generate a displayable value for the writing rate used from the hoursperwriting matrix
    output$hoursperwriting.out <- renderText({
      expr = paste(hoursperwriting[
        as.numeric(input$writtendensity), as.numeric(input$draftrevise), as.numeric(input$writingpurpose)
        ], "hours per page")
    })
    
  }
              
)