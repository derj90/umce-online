library(shiny)

shinyUI(
  fluidPage(
    
#    tags$head(
#      tags$style(
#        "body{
#    max-width: 960px;
#    margin: auto;
#        }"
#      )
#    ),
    
    tags$head(includeScript("google-analytics.js")),
    
        h3("Enhanced Course Workload Estimator", align="center"),
    
        p(strong("Research & Design:"), HTML('&nbsp;'), a("Betsy Barre", href="https://cat.wfu.edu/about/our-team/", target="blank"), HTML('&nbsp;'), a("|"), HTML('&nbsp;'), a("Allen Brown", href="https://oe.wfu.edu/about/", target="blank"), HTML('&nbsp;'), a("|"), HTML('&nbsp;'), a("Justin Esarey", href="http://www.justinesarey.com", target="blank"), br(), a("Click Here for Estimation Details", #href="https://cat.wfu.edu/resources/tools/estimator2details/",  
href="http://www.cte.rice.edu/workload#howcalculated",
target="blank"), align="center"),
    
    hr(),
    
    fluidRow(
      
      column(3,
      
             
       h5("COURSE INFO", align = "center"),
       wellPanel(
         numericInput(
           inputId = "classweeks",
           label = "Class Duration (Weeks):",
           value=15,
           width='100%',
         )
       ),
       
       h5("READING ASSIGNMENTS", align = "center"),
       
        wellPanel(# reading panel
             
          numericInput(
            inputId = "weeklypages",
            label = "Pages Per Week:",
            value=0,
            width='100%'
          ),
          
          hr(),
          
          selectInput(inputId="readingdensity", label="Page Density:",c("450 Words"=1, "600 Words"=2,"750 Words"=3), selected=1),
          
          selectInput(inputId="difficulty", label="Difficulty:",c("No New Concepts"=1,"Some New Concepts"=2,"Many New Concepts"=3), selected=1),
          
          selectInput(inputId="readingpurpose", label="Purpose:",c("Survey"=1,"Understand"=2,"Engage"=3), selected=1),
          p(strong("Estimated Reading Rate:"),br(),textOutput("pagesperhour.out", inline=T),br(),br(),
            
          checkboxInput("setreadingrate", "manually adjust", value=F, width='100%'), align="center"),
          
          conditionalPanel("input.setreadingrate == true",
              numericInput(inputId="overridepagesperhour", label="Pages Read Per Hour:", value=10, min=0, max=NA)
          )
          
          #br(), br(), br(style="line-height:25px")
        ) # end of Reading panel
      ), # end of Column 1 
      
      column(3, # beginning of Column 2 
             
       h5(paste("WRITING ASSIGNMENTS"), align = "center"),
       
        wellPanel( # Writing assignment panel
          
          numericInput(
            inputId = "semesterpages",
            label = "Pages Per Semester:",
            value=0,
            width='100%'
          ),
          hr(),
          selectInput(inputId="writtendensity", label="Page Density:",c("250 Words"=1, "500 Words"=2), selected=1),
          
          selectInput(inputId="writingpurpose", label="Genre:",c("Reflection/Narrative"=1, "Argument"=2, "Research"=3), selected=1),
          
          selectInput(inputId="draftrevise", label="Drafting:",c("No Drafting"=1, "Minimal Drafting"=2, "Extensive Drafting"=3), selected=1),
          
          p(strong("Estimated Writing Rate:"),br(),textOutput("hoursperwriting.out", inline=T), br(),br(),checkboxInput("setwritingrate", "manually adjust", value=F, width='100%'), align="center"),
          
          conditionalPanel("input.setwritingrate == true",
                           
              numericInput(inputId="overridehoursperwriting", label="Hours Per Written Page:", value=.5, min=0.1, max=NA)
          )
                  ), # end of Writing assignment panel
       
       
       h5("VIDEOS / PODCASTS", align = "center"),
       
       wellPanel( # Video and Audio panel
         
         numericInput(
           inputId = "weeklyvideos",
           label = "Hours Per Week:",
           value=0,
           width='100%'
         )
         
         #br(), br(), br(style="line-height:25px")
         
       ) # end of Video and Audio panel

      ),  # end of Column 2
     
      column(3,  # beginning of Column 3
             
     h5("DISCUSSION POSTS", align = "center"),
     
     wellPanel( # Discussion board panel
       
       numericInput(
         inputId = "postsperweek",
         label = "Posts per Week:",
         value=0,
         width='100%'
       ),
       
       hr(),
       
       selectInput(inputId="postformat", label="Format:",c("Text"=1, "Audio/Video"=2), selected=1),
       
       conditionalPanel("input.postformat == 1",
                        numericInput(inputId="postlength.text", label="Avg. Length (Words):", 
                                     value=250, min=0, max=NA)
       ),
       
       conditionalPanel("input.postformat == 2",
                        numericInput(inputId="postlength.av", label="Avg. Length (Minutes):", 
                                     value=3, min=0, max=NA)
       ),
       
       p(strong("Estimated Hours:"),br(),textOutput("hoursperposts.out", inline=T), br(), br(), checkboxInput("setdiscussion", "manually adjust", value=F, width='100%'), align="center"),
       
       conditionalPanel("input.setdiscussion == true",
                        
          numericInput(inputId="overridediscussion", label="Hours Per Week:", value=1, min=0, max=NA)
       )#,br(style="line-height: 0px")
       
       
       
       
     ), # end of Discussion board panel
             
       h5("EXAMS", align = "center"),
       
      wellPanel(     # Exam panel
        
        numericInput(
            inputId = "exams",
            label = "Exams Per Semester:",
            value=0,
            width='100%'
          ),
        
        #sliderInput(
        numericInput(
          inputId = "examhours",
          label = "Study Hours Per Exam:",
          min=0,
          max=50,
          #step=1,
          value=5,
          width='100%'
        ),
        
        checkboxInput("takehome", "Take-Home Exams", value=F, width='100%'),
        
        conditionalPanel("input.takehome == true",
                         numericInput(inputId="exam.length", label="Exam Time Limit (in Minutes)", 
                                      value=60, min=0, max=NA)
        )#, br(style="line-height:0px")
      
      )

      ),
      column(3,
             
             h5("OTHER ASSIGNMENTS", align = "center"),
             wellPanel(  
               numericInput(
                 inputId = "otherassign",
                 label = "# Per Semester:",
                 value=0,
                 width='100%'
               ),
               sliderInput(
                 inputId = "otherhours",
                 label = "Hours Per Assignment:",
                 min=0,
                 max=50,
                 step=1,
                 value=0,
                 width='100%'
               ),
              checkboxInput("other.engage", "Independent", value=F, width='100%')
             ),
             
             h5("CLASS MEETINGS", align = "center"),
             
             wellPanel( # beginning of Synchronous Sessions panel
               
               numericInput(
                 inputId = "syncsessions",
                 label = "Live Meetings Per Week:",
                 value=0,
                 width='100%'
               ),
               
               numericInput(
                 inputId = "synclength",
                 label = "Meeting Length (Hours):",
                 value=0,
                 width='100%'
               )
               
             ), # end of Synchronous Sessions panel
             
             hr(),
             
             h5("WORKLOAD ESTIMATES", align = "center"),
             
             wellPanel(
               p(strong(textOutput("estimatedworkload", inline=T)), align="right"),
               p(strong(textOutput("estimatedoutofclass", inline=T)), align="right"),
               p(strong(textOutput("estimatedengaged", inline=T)), align="right")
               #br(style="line-height:27px")
             )
             
             
      )
    ),
    
    hr(),
    div(a(img(src="cc-by-nc-sa.png"),href="https://creativecommons.org/licenses/by-nc-sa/4.0/"), style="text-align: center;"),
    div(a(href="source.zip", "Download Source Code"), style="text-align:center;")
  
  )
)

