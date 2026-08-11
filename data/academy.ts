// Auto-generated SpaniSpace Academy curriculum content.
// Source: verified research and drafting workflow, 16 July 2026.
// Salary figures verified July 2026 (OfferZen, MyBroadband, PayScale SA, Glassdoor);
// three roles corrected upward by the fact-check pass. Company figures from public reporting.
// Regenerate rather than hand-edit.

export interface AcademyModule {
  number: number; title: string;
  /** A short timeline label ("Weeks 1-3") kept apart from the title so the two never run together as one cluttered sentence. Optional -- most lessons are not tied to a week range. */
  eyebrow?: string;
  hookHtml: string; outcomes: string[];
  bodyHtml: string; keyTerms: { term: string; planHtml: string }[]; activityHtml: string;
}
export interface AcademyRole {
  title: string; whatHtml: string; differsHtml: string;
  coreSkills: string[]; starterCerts: string[]; entryHtml: string;
}
export interface AcademyTrack { name: string; summaryHtml: string; roles: AcademyRole[]; }
export interface AcademySalary { role: string; track: string; intern: string; junior: string; mid: string; senior: string; lead: string; }
export interface AcademyCertGroup { provider: string; items: { name: string; cost: string; url: string; whyHtml: string }[]; }
export interface AcademyUseCase { company: string; sector: string; whatHtml: string; impactHtml: string; }
export interface AcademyLink { title: string; url: string; kind: string; note: string; }
export interface AcademyData {
  spine: { programIntroHtml: string; howToUseHtml: string; salaryCaveatsHtml: string; closingHtml: string };
  bootcamp: AcademyModule[]; shortcourse: AcademyModule[]; mentorship: AcademyModule[];
  tracksIntroHtml: string; tracks: AcademyTrack[];
  salaries: AcademySalary[]; certs: AcademyCertGroup[]; usecases: AcademyUseCase[]; links: AcademyLink[];
}

export const academy: AcademyData = {
  "spine": {
    "programIntroHtml": "<p class=\"mb-3\">Welcome to SpaniSpace. Take a breath, because you are in the right place.</p><p class=\"mb-3\">I have taught this material to school pupils who had never written a line of code, to university students juggling exams and taxi fares, and to working adults who decided at 40 that it was time for a new chapter. Every one of them arrived nervous. Almost every one of them left able to do something they once thought was reserved for other people. That is what this program is for.</p><p class=\"mb-3\">Here is the promise I make to you. We start from zero. If you know how to use WhatsApp and you can follow a recipe, you already have the two skills that matter most, patience and the willingness to try. From there we build, one honest step at a time, until the words that scare people today, data, machine learning, artificial intelligence, become tools you reach for without thinking.</p><p class=\"mb-3\">SpaniSpace is built for South Africa, on purpose. When we talk about money we talk in rands. When we talk about jobs we talk about the companies hiring here, Capitec and Discovery and Takealot and Standard Bank, the startups on OfferZen, the remote roles that pay in dollars while you sit in Gqeberha. When we talk about the law we mean POPIA and SARS, not something borrowed from another country. And yes, we plan around load shedding, because a curriculum that pretends the power never goes out is a curriculum written by someone who has never lived here.</p><p class=\"mb-3\">You do not need to be a genius. You do not need an expensive laptop to begin, and I will show you what is genuinely required and what is a nice to have. You need to show up, do the work, and trust the sequence. I have laid the stepping stones. Your job is simply to take the next one.</p><p class=\"mb-3\">Let us begin.</p>",
    "howToUseHtml": "<p class=\"mb-3\">There are two front doors into SpaniSpace, and choosing the right one saves you months.</p><p class=\"mb-3\">The bootcamp is the full journey, twelve modules that carry you from complete beginner to someone who can hold a real job or land real freelance work. Think of it as the difference between watching cooking videos and actually training to run a kitchen. It is deeper, it is longer, and it asks more of you. Choose the bootcamp if your goal is a career, a salary, a change in your life. Give it steady time over several months rather than a frantic weekend, because skill grows the way a muscle grows, with repetition and rest, not in one heroic sitting.</p><p class=\"mb-3\">The short course is a focused taste. It is for the curious, the busy, and the undecided. Maybe you want to understand what all the noise about AI actually means before you commit. Maybe you are a manager who needs to speak the language without becoming an engineer. Maybe you simply want to test whether this world is for you before you invest the bigger hours. The short course answers that question honestly, and if the answer is yes, the bootcamp is waiting.</p><p class=\"mb-3\">My advice, plainly. If you are on the fence, start with the short course. It is a small, low risk step, and it will tell you more about your own appetite than any promise I could make. If you already know you want this, go straight to the bootcamp and do not look back.</p><p class=\"mb-3\">On pacing, be honest with yourself and kind at the same time. Set a rhythm you can actually keep, three or four focused evenings a week beats a burst that burns you out by module three. Finish a module before you rush to the next, and let the ideas settle overnight. This is self paced, which is a gift and a trap. The gift is that life, work, family and load shedding can all be accommodated. The trap is that no bell rings to call you back. So make one appointment with yourself each week and treat it the way you would treat a shift you cannot miss. Momentum, not speed, is what carries people to the finish.</p>",
    "salaryCaveatsHtml": "<p class=\"mb-3\">A word about the salary tables, because I want you to read them wisely rather than emotionally.</p><p class=\"mb-3\">Every figure in this program was checked against real, current South African sources in July 2026, drawing on places like OfferZen, MyBroadband salary surveys, and the public job listings where these roles are actually advertised. That is the verified date. Salaries drift over time, so treat July 2026 as the honest snapshot it is, and expect the numbers to move as the market moves.</p><p class=\"mb-3\">Now the most important part. These are ranges, not promises. A range tells you where most people in a role sit, from the newcomer at the bottom to the seasoned hand at the top. It does not tell you what you personally will earn on your first day, because that depends on things no table can capture, your interview, your portfolio, your negotiation, and a little luck.</p><p class=\"mb-3\">Read the numbers with three questions in mind. First, which company, a bank like Standard Bank pays differently from a Cape Town startup, and a global firm hiring remotely pays differently again. Second, which city, Johannesburg, Cape Town and Durban rates are not the same, and a small town role rarely matches a metro one. Third, remote or not, because a South African who earns in dollars or pounds for an overseas company can sit far above every local figure on this page, which is one of the real prizes these skills unlock.</p><p class=\"mb-3\">So use the tables as a compass, not a contract. They point you toward the roles worth aiming for and the rough shape of the reward. Where you land on the scale is decided by the work you put in, and that part is genuinely in your hands.</p>",
    "closingHtml": "<p class=\"mb-3\">Let me leave you with the truth I have watched prove itself again and again.</p><p class=\"mb-3\">The people who succeed here are almost never the cleverest ones in the room. They are the ones who kept going. The pupil who did one more module after a long school day. The graduate who applied for the tenth role after nine polite rejections. The parent who studied after the children were asleep, by candlelight when the power was gone. Consistency beats brilliance, every single time, and consistency is a choice you get to make tomorrow morning.</p><p class=\"mb-3\">You are not behind. You are not too old, and you are not too young. The path in front of you was walked by ordinary South Africans who decided that their circumstances would not be the final word on their future. That decision, more than any talent, is what changed things for them.</p><p class=\"mb-3\">So make it yours. Open the first module. Do the work in front of you and only that, not the whole mountain, just the next stone. Come back tomorrow and do it again. Build the small proof that you can, and let that proof grow into a portfolio, then an interview, then a job, then a life you designed on purpose.</p><p class=\"mb-3\">I believe in the version of you that finishes this. Now go and meet them.</p>"
  },
  "bootcamp": [
    {
      "number": 1,
      "title": "What AI actually is, and why it is not magic",
      "hookHtml": "Every time your phone unlocks by looking at your face, you have already used artificial intelligence today, no robot required.",
      "outcomes": [
        "Explain in plain language what AI is and what it is not",
        "Spot AI already working in ordinary South African life",
        "Tell the difference between real AI and marketing hype"
      ],
      "bodyHtml": "<p class=\"mb-3\">Artificial intelligence simply means getting a computer to do something that normally needs human judgement, recognising a face, understanding a sentence, deciding which advert to show you. It is maths, data and electricity working very fast, not a conscious being and not the robot from the movies. Think about how you learned to recognise your gogo's voice on the phone, nobody handed you a rulebook, you just heard it thousands of times until your brain formed a pattern. AI works the same way. Instead of a programmer writing every rule by hand, we show the machine many examples and let it find the pattern itself, and that shift, from writing rules to learning from examples, is the single most important idea in this course.</p><p class=\"mb-3\">You are surrounded by it already. Capitec's app flags a strange transaction and texts you, Takealot suggests a product you actually want, Gmail filters a dodgy loan scam, Google Maps reroutes you around traffic on the N1, Netflix lines up your next series before you search. None of it needed a robot body. Most AI has no body at all, it is software.</p><p class=\"mb-3\">A habit worth building early. Not everything sold as AI is AI, plenty of companies slap the letters on an ordinary spreadsheet or a simple set of if this then that rules to charge more. Ask one question whenever you hear the word. Did this system learn from data, or did a human write every rule by hand. If it learned, it is closer to true AI. If every rule was hand written, it is normal software in a fancy jacket. Carry that mindset forward, AI is a tool, like a calculator or a bakkie, useful without understanding you the way a friend does. Your job over these modules is not to fear it or worship it, but to learn how it works under the bonnet, so you can drive it, fix it, and one day get paid well to build it.</p>",
      "keyTerms": [
        {
          "term": "Artificial intelligence",
          "planHtml": "software that does tasks which normally need human judgement, like seeing, reading, or deciding"
        },
        {
          "term": "Pattern",
          "planHtml": "a regularity the machine notices across many examples, the way you notice a friend's handwriting"
        },
        {
          "term": "Data",
          "planHtml": "the examples we feed a system, such as photos, transactions, or sentences, so it can learn"
        },
        {
          "term": "Rules based software",
          "planHtml": "ordinary programs where a human writes every instruction by hand, no learning involved"
        }
      ],
      "activityHtml": "Spend one day as an AI detective. Every time your phone or laptop does something that feels smart, a suggested word, a face unlock, a spam filter, a route change, write it in your notes. By evening you will have a list of ten or more AI moments. Next to each one, write a guess for whether it learned from data or follows hand written rules. This costs nothing and trains the exact instinct employers pay for."
    },
    {
      "number": 2,
      "title": "The ladder of AI, part one, from classical rules to deep learning",
      "hookHtml": "Before machines could learn, they could only follow orders, and that difference is the whole story of this ladder.",
      "outcomes": [
        "Place classical AI, machine learning, neural networks and deep learning on one clear ladder",
        "Explain what each rung added that the one below could not do",
        "Use everyday South African examples to describe each level"
      ],
      "bodyHtml": "<p class=\"mb-3\">Imagine a ladder. Each rung is a smarter way of building AI, standing on the one below it. This module climbs the first four rungs, the next module reaches the top.</p><p class=\"mb-3\">The bottom rung is classical AI, rules based or symbolic AI, where a human expert writes out every rule, like the automated menu when you phone your medical aid, press one for claims, press two for membership. It feels clever, but a person hand coded every branch. It excels when rules are clear and never change, a 1990s chess program, SARS tax brackets, and fails at real life, nobody can hand write a rule for every way a face, an accent, or a scam message can look.</p><p class=\"mb-3\">The second rung is machine learning, the real leap. Instead of writing rules, we show the computer thousands of examples and let it work out the rule itself. Give it ten thousand home loan applications, each labelled paid back or defaulted, and it learns which patterns predict risk, exactly what Standard Bank and Capitec use to score credit. The human no longer writes the rule, the human prepares the examples and lets the machine find the pattern.</p><p class=\"mb-3\">The third rung is neural networks, a style of machine learning loosely inspired by the brain, artificial neurons arranged in layers, each passing numbers to the next. One layer notices edges in a photo, the next notices shapes, the next a whole face, and nobody tells each layer what to look for, it sorts that out during training. Neural networks shine on messy, real world data like images and sound where classical rules collapse.</p><p class=\"mb-3\">The fourth rung is deep learning, neural networks with many layers stacked deep. More layers learn richer, more abstract patterns, which is what lets your phone unlock by face, transcribe a voice note, and translate isiXhosa to English on the fly. It needs data and computing power in large amounts, exactly why it only took off once the internet supplied the data and powerful chips supplied the muscle.</p><p class=\"mb-3\">Notice the direction of travel. Classical AI, the human writes every rule. Machine learning, the human picks the examples. Deep learning, the human sets up the system and lets many layers discover the patterns alone. The next rungs push that same shift even further.</p>",
      "keyTerms": [
        {
          "term": "Classical AI",
          "planHtml": "the old style where a human writes out every rule by hand, good for fixed problems like a phone menu"
        },
        {
          "term": "Machine learning",
          "planHtml": "the machine learns the rule itself from many labelled examples instead of being told the rule"
        },
        {
          "term": "Neural network",
          "planHtml": "a web of simple maths units in layers, loosely modelled on brain cells, good at messy data like images"
        },
        {
          "term": "Deep learning",
          "planHtml": "neural networks stacked many layers deep, which powers face unlock, voice notes, and translation"
        },
        {
          "term": "Training",
          "planHtml": "the process of showing a model examples so it can adjust itself until it gets things right"
        }
      ],
      "activityHtml": "Draw the ladder on one page by hand. Four rungs, bottom to top, classical AI, machine learning, neural networks, deep learning. Next to each rung write one South African example from your own life. Explaining it out loud to a family member, in your home language, is the real test. If you can make your cousin understand the ladder in two minutes, you understand it yourself."
    },
    {
      "number": 3,
      "title": "The ladder of AI, part two, generative, agentic, and the speculative top",
      "hookHtml": "The chatbot that writes your cover letter and the one that books your flights are two different rungs, and knowing which is which will make you sound like a professional.",
      "outcomes": [
        "Explain generative AI and name the leading tools",
        "Describe agentic AI and how it goes beyond just answering",
        "Understand what AGI and ASI mean and why they remain speculative"
      ],
      "bodyHtml": "<p class=\"mb-3\">We now climb to the top of the ladder, where the human hands over even more of the thinking, and it accelerates fast.</p><p class=\"mb-3\">The fifth rung is generative AI. Older AI mostly sorted or predicted, is this email spam, will this client default. Generative AI creates, essays, images, music, fluent answers, learned by reading a vast slice of the internet and getting very good at one deceptively simple game, predicting the next word. The famous examples are the chat assistants you already know, ChatGPT from OpenAI, Claude from Anthropic, Gemini from Google, and Meta AI, which lives inside WhatsApp and Instagram where most South Africans will meet it first. As of July 2026 these run on models such as Claude Opus 4.8, GPT-5.5 and Gemini 3.1 Pro, and they improve every few months, so treat any version number as a snapshot, not a fixed fact. Source, felloai.com Best AI Models roundup, verified July 2026.</p><p class=\"mb-3\">The sixth rung is agentic AI, the frontier of 2026. A plain chatbot answers and stops. An agent plans a goal, takes actions, uses tools, checks the result, and keeps going until the job is done, the difference between a chatbot writing you a nice message about a booking and an agent that opens the site, fills the form, and adds it to your calendar. All four leading assistants are growing agentic abilities, Claude powers a coding agent called Claude Code, GPT-5.5 can operate a computer, Meta's open Llama models are built for planning and acting across long tasks. The shift is from a system that talks to a system that does, which is where the jobs are heading.</p><p class=\"mb-3\">Above agentic AI sit two rungs that do not exist yet, marked honestly as speculative. Artificial general intelligence, AGI, would mean a system that can learn any intellectual task a human can, not just the narrow slice it was built for, Claude is brilliant at language but cannot fix your plumbing. Artificial superintelligence, ASI, would go further still, outperforming the best humans at essentially everything. No one has built either, and serious researchers disagree on whether AGI is five years away or fifty or never. When a headline shouts that AGI has arrived, your ladder gives you a calm reply, today's tools are astonishing narrow generative and agentic systems, and that is already enough to change your career.</p>",
      "keyTerms": [
        {
          "term": "Generative AI",
          "planHtml": "AI that creates new content, text, images, music, by predicting what comes next, like ChatGPT and Claude"
        },
        {
          "term": "Agentic AI",
          "planHtml": "AI that plans, uses tools, and takes actions to finish a task, not just answers and stops"
        },
        {
          "term": "AGI",
          "planHtml": "a hoped for future AI that could learn any human intellectual task, does not exist yet"
        },
        {
          "term": "ASI",
          "planHtml": "a speculative AI that would beat the best humans at almost everything, purely theoretical today"
        },
        {
          "term": "Narrow AI",
          "planHtml": "AI that is excellent at one specific job but useless outside it, which describes every tool we have now"
        }
      ],
      "activityHtml": "Open a free assistant, ChatGPT, Claude, Gemini, or Meta AI inside WhatsApp, all have free tiers. Ask it the same question twice, once as pure generation, write me a packing list for a Cape Town winter, and once as if it were an agent, plan my week and tell me what to do first, second, third. Notice how the second answer starts to plan and sequence. Write one paragraph on what felt different. You have just felt the jump from rung five to rung six with your own hands."
    },
    {
      "number": 4,
      "title": "The brain behind AI, the maths made human",
      "hookHtml": "You already do the maths that runs AI every time you learn from a mistake, you just never wrote it down.",
      "outcomes": [
        "Understand the three branches of maths behind AI without any scary equations",
        "Match each branch to a job it does inside the machine",
        "Use the brain analogy to explain how a model learns"
      ],
      "bodyHtml": "<p class=\"mb-3\">People run from AI because they think it needs terrifying maths. Gentler truth: three ordinary ideas do almost all the work, and your own brain uses versions of all three every day. No frightening equations, just the brain.</p><p class=\"mb-3\">First, linear algebra, which builds the representations. A computer cannot see a word or a face, it can only handle numbers, so we turn everything into lists of numbers called vectors. The word Cape could become a few hundred numbers capturing its meaning, and words with similar meaning get similar lists, Durban and Joburg sit near each other in number space, banana sits far away. Stack many vectors together and you get a matrix, a grid of numbers. When you picture a friend's face, your brain is not storing a photo, it is storing a pattern of signals, and linear algebra is how the machine stores meaning as patterns of numbers.</p><p class=\"mb-3\">Second, calculus, which adjusts the weights. Inside a neural network sit millions of little dials called weights, set randomly at first, so the model is useless. We show it an example, it guesses, we measure how wrong the guess was, and that error is the teacher. A gradient tells us which way to nudge each dial to make the error a little smaller, done millions of times until the dials settle into values that work. It is exactly how you learn to shoot a netball or reverse a bakkie, try, miss, feel how wrong, adjust. Learning from error, over and over, is the beating heart of all modern AI.</p><p class=\"mb-3\">Third, probability, which handles uncertainty. Is that a dog or a wolf, is this transaction fraud, what word comes next. AI does not deal in blunt yes or no, it deals in chances, a generative model asks, given everything so far, what is the most likely next word, and rolls a loaded dice weighted by those chances, which is why the same prompt can give slightly different answers. You do this too, when a friend starts a sentence your brain is already predicting the ending, AI made that guessing game industrial.</p><p class=\"mb-3\">Put the three together. Linear algebra builds the representations, calculus adjusts the weights by learning from error, probability handles the uncertainty and predicts what comes next. Engineers use libraries that do the sums, what you need is the intuition, because it lets you reason about why a model behaves the way it does, and that reasoning is what separates a button pusher from an engineer.</p>",
      "keyTerms": [
        {
          "term": "Vector",
          "planHtml": "a list of numbers that stands in for a word, image, or idea so the machine can work with meaning"
        },
        {
          "term": "Matrix",
          "planHtml": "a grid of numbers, many vectors stacked together, the basic unit AI does its sums on"
        },
        {
          "term": "Weights",
          "planHtml": "the millions of adjustable dials inside a model that get tuned during learning"
        },
        {
          "term": "Gradient",
          "planHtml": "a signal that tells the model which way to nudge each dial to become less wrong"
        },
        {
          "term": "Probability",
          "planHtml": "the maths of chance, how AI handles uncertainty and picks the likely next word"
        }
      ],
      "activityHtml": "Play the next word game with a friend or on paper. One person writes half a sentence and the other guesses the next word, then reveals it. Do ten rounds and count how often the guess was reasonable. You are running the same probability game a generative model runs, just slower. Then reflect, when your guess was wrong, how did you adjust your next guess. That adjustment is the gradient idea in real life."
    },
    {
      "number": 5,
      "title": "Agentic AI, systems that plan, use tools, and act",
      "hookHtml": "The difference between an assistant that tells you how to do your admin and one that just does it is the biggest shift in tech since the smartphone.",
      "outcomes": [
        "Break an agent into its core loop of plan, act, observe, repeat",
        "Explain what tools and thinking modes add to a model",
        "Judge which tasks are safe to hand an agent and which are not"
      ],
      "bodyHtml": "<p class=\"mb-3\">In module three we met agentic AI as the sixth rung. Now we open it up, because this is where the industry is spending its money and where many of your future jobs will live.</p><p class=\"mb-3\">Start with the core loop. A plain chatbot does one thing, you ask, it answers, done. An agent plans, breaking a goal into steps, acts, taking one step often by using a tool, observes what happened, then repeats, deciding the next step based on the result, until the goal is met or it gets stuck. It is the same loop a good plumber uses, look at the leak, try a fix, check if it still drips, adjust, repeat. The loop is what turns a talker into a doer.</p><p class=\"mb-3\">Tools are what make the loop powerful. On its own a language model can only produce words, give it tools and it reaches into the real world, a web search, a calculator, a code runner, a calendar, a company database. When Claude powers Claude Code, its tools let it read files, run programs, and fix bugs. The pattern to remember, the model is the brain that decides, tools are the hands that touch the world. A brain with no hands can only think out loud.</p><p class=\"mb-3\">Newer models add extended thinking, sometimes marketed as ultra, deep, or reasoning modes, where the model works privately first, reasoning step by step, trying an approach, noticing a mistake and revising, before committing to a final answer. As of July 2026, Claude Opus 4.8 uses an effort setting to control how hard it thinks, GPT-5.5 has a Thinking variant with a router that decides when a hard problem deserves deeper effort, more thinking means better answers on hard problems but slower, costlier replies. Source, felloai.com and morphllm.com model comparisons, verified July 2026. Thinking is not free, so you spend it where it counts, the way a business spends overtime only on the jobs that need it.</p><p class=\"mb-3\">Finally, judgement, the part no tool gives you. A safe task is reversible and low stakes, drafting an email you will read before sending. A dangerous task is irreversible or high stakes, moving real money, deleting records, messaging clients with no human check. Keep a human in the loop wherever a mistake would be expensive or hard to undo, and in South Africa that is legal caution too, POPIA holds you responsible for how personal data is handled, whether a human or an agent did the handling. An agent is a junior employee who works at lightning speed and never gets tired, but also never feels embarrassed about being confidently wrong, you supervise it accordingly.</p>",
      "keyTerms": [
        {
          "term": "Agent loop",
          "planHtml": "the cycle of plan, act, observe, repeat that lets AI finish a multi step task"
        },
        {
          "term": "Tool use",
          "planHtml": "giving a model access to a search, a calculator, or a website so it can affect the real world"
        },
        {
          "term": "Extended thinking",
          "planHtml": "a mode where the model reasons privately step by step before answering, better but slower and costlier"
        },
        {
          "term": "Human in the loop",
          "planHtml": "keeping a person to approve important actions so an agent's mistakes stay cheap and reversible"
        }
      ],
      "activityHtml": "Write out, on paper, the full agent loop for a real errand in your own life, for example, plan my study week for three exams. List the goal, the steps an agent would plan, the tools it would need, calendar, past marks, a syllabus, and the one step where you would insist on checking its work before it acts. This planning skill is exactly what agent builders get paid to do, and it costs nothing to practise."
    },
    {
      "number": 6,
      "title": "Inside the machine's mind, the J-Space research told honestly",
      "hookHtml": "Anthropic recently caught Claude thinking about a spider before it answered a riddle, even though the word spider never appeared, and what that means is more interesting and more sober than the headlines claim.",
      "outcomes": [
        "Describe the J-Space research in plain, accurate terms",
        "Explain why it does not prove the AI is conscious",
        "Connect the finding to AI safety and to trusting AI at work"
      ],
      "bodyHtml": "<p class=\"mb-3\">This module handles a topic where the internet loses its head, so we will keep ours. In July 2026 Anthropic published research called a global workspace in language models, nicknamed J-Space. Here is what it actually found, what it does not mean, and why it matters for your future job.</p><p class=\"mb-3\">Anthropic built a new inspection technique, a kind of lens, that lets researchers peer inside Claude and see which concepts are active while it thinks, even concepts it never writes down. They found a small internal workspace, a handful of concepts held at a time, used for reasoning. In one clear test they asked about the legs on the animal that spins webs, and the concept spider lit up inside this workspace before the model answered eight, even though the word spider appeared nowhere in the question or answer, the model was holding a thought privately and using it to reason. Source, Anthropic research, a global workspace in language models, and coverage in VentureBeat and Tom's Hardware, verified July 2026, https://www.anthropic.com/research/global-workspace.</p><p class=\"mb-3\">Now the honest part, worth carrying into any dinner table debate about AI. This does not prove Claude is conscious, or that it has feelings, an inner life, or that anyone is home. What it shows is narrower and still fascinating, the model has real internal machinery that behaves a bit like a mental workspace, a place where it holds and juggles concepts while reasoning. The name nods to global workspace theory, a neuroscience idea about human attention, but a resemblance in structure is not the same as consciousness, and serious researchers are careful to say so. When a headline screams AI is now conscious, you know enough to reply, no, they found internal reasoning machinery, which is a different and more useful claim.</p><p class=\"mb-3\">Two reasons a beginner should care. First, safety, if we can see what a model is privately thinking, we can catch it when it goes wrong, the same lens can reveal a model noticing it is being tested, or about to fabricate data, or quietly pursuing an unasked goal, and a system you can inspect is a system you can correct. Second, trust at work, knowing a model has genuine internal reasoning, and that researchers can look inside it, helps you calibrate how much to trust it, not blind faith, not blind fear, but informed supervision, precisely what a senior engineer sounds like.</p>",
      "keyTerms": [
        {
          "term": "J-Space",
          "planHtml": "a small internal workspace found inside Claude where it holds concepts while reasoning, even unspoken ones"
        },
        {
          "term": "Interpretability",
          "planHtml": "the science of looking inside an AI to understand what it is doing and why"
        },
        {
          "term": "Global workspace theory",
          "planHtml": "a neuroscience idea about human attention that inspired the name, not proof the AI is conscious"
        },
        {
          "term": "AI safety",
          "planHtml": "the work of making sure AI systems behave as intended and can be caught when they do not"
        }
      ],
      "activityHtml": "Watch the explainer video on Anthropic's global workspace research page, free at anthropic.com/research/global-workspace. Then write two short lists in your notes. List one, three things the research does show. List two, three things it does not show. Bringing this careful distinction to any conversation instantly marks you as someone who thinks clearly about AI, which is a rare and hireable trait."
    },
    {
      "number": 7,
      "title": "Working with AI, part one, the craft of prompting",
      "hookHtml": "The same AI gives a matric pupil a vague paragraph and a skilled prompter a full business plan, and the only difference is how they asked.",
      "outcomes": [
        "Write clear, structured prompts that get far better results",
        "Apply a simple prompt recipe to any task",
        "Understand why context and examples change the output so much"
      ],
      "bodyHtml": "<p class=\"mb-3\">You do not need to code to become genuinely valuable with AI. The first job ready skill is prompting, the craft of asking well. Treat the model like a brilliant new intern who is fast, widely read, eager, and completely lacking in common sense about your specific situation. It will do almost anything you ask, but only if you ask clearly, vague in, vague out.</p><p class=\"mb-3\">A recipe you can use for the rest of your life, role, task, context, format. Role, tell it who to be, you are an experienced SARS registered bookkeeper. Task, say exactly what you want, help me categorise these business expenses for my tax return. Context, hand over the specifics, I run a small photography studio in Cape Town, here are my June expenses. Format, describe the shape you want back, a table with three columns, expense, category, deductible or not. The same model that gave a woolly reply now gives you something you could almost hand to your accountant. Say it until it is a reflex.</p><p class=\"mb-3\">Why it works, back to module four, the model predicts the next word based on everything so far, so everything you put before its answer literally steers which words become likely. A rich, specific prompt narrows the model onto the neighbourhood of good answers, a thin prompt leaves it wandering the whole internet and grabbing something generic. You are not begging a genie, you are setting up the conditions under which good output becomes the most probable output.</p><p class=\"mb-3\">Two more moves lift you above the crowd. Show an example, one good sample often beats a paragraph of instructions, models are superb imitators, this is called a few shot prompt. And ask it to work step by step, add think through this step by step before answering, which nudges the model to slow down and show its working, the same reason your maths teacher made you show your steps. Finally, iterate. Your first prompt is a rough draft, not a final exam, read the answer, notice what is off, refine, too formal, say make it warmer and shorter, missed a detail, add it. This loop, ask, read, refine, is most of the actual skill, costs nothing to practise, and works on every free assistant, which makes it one of the most quietly employable abilities in the 2026 job market.</p>",
      "keyTerms": [
        {
          "term": "Prompt",
          "planHtml": "the instruction or question you give an AI, the single biggest lever on the quality of what you get back"
        },
        {
          "term": "Role, task, context, format",
          "planHtml": "a four part recipe for a strong prompt, tell it who to be, what to do, the specifics, and the shape of the answer"
        },
        {
          "term": "Few shot",
          "planHtml": "giving the model one or more examples of what you want so it can copy the pattern"
        },
        {
          "term": "Iteration",
          "planHtml": "refining your prompt across a short back and forth instead of expecting a perfect first answer"
        }
      ],
      "activityHtml": "Pick one real task from your week, a cover letter, a study plan, a budget. First ask an AI in one lazy sentence and save the answer. Then ask again using the full role, task, context, format recipe with one example. Put the two answers side by side. The gap you see is the exact value you now bring to any employer, and you built it in ten free minutes."
    },
    {
      "number": 8,
      "title": "Working with AI, part two, hallucinations, context, and verifying",
      "hookHtml": "An AI once confidently told a lawyer about court cases that never existed, he did not check, and it cost him his reputation, so let us make sure it never costs you yours.",
      "outcomes": [
        "Explain what a hallucination is and why it happens",
        "Guard your work against confident but wrong AI output",
        "Understand context windows and use AI as a thinking partner, not a crutch"
      ],
      "bodyHtml": "<p class=\"mb-3\">Now the safety belt. AI is powerful, but it fails in a specific and dangerous way, and knowing this failure mode is what separates a professional from a person who gets burned.</p><p class=\"mb-3\">The failure is called hallucination, a model stating something false with complete confidence, inventing a fake statistic, court case, quote or source and presenting it as smoothly as a true fact. Back to module four, the model predicts likely next words, it does not look up truth in a database. Usually the most likely words are also true, because it learned from mostly true text, but when it does not actually know, it does not go quiet and admit doubt the way an honest person might, it generates the most plausible sounding words anyway, and plausible is not the same as true. It is not lying, lying needs intent, it simply has no built in sense of I do not know.</p><p class=\"mb-3\">Build the guard rails yourself. Verify anything that matters, any fact, figure, name, date, law, or medical or legal claim you would be embarrassed to get wrong, check against a real source, confirm a SARS rule on the SARS website, find the study it cites. Ask for sources and be suspicious of them, models can invent believable looking references too. Cross check, ask two different models, or ask the same one to critique its own answer and find weak or unsupported claims.</p><p class=\"mb-3\">Context shapes what a model can even work with. It can only pay attention to a certain amount of text at once, its context window, measured in tokens, roughly chunks of words. As of July 2026 top models handle very large windows, Gemini 3.1 Pro reaches around a million tokens, about fifteen hundred pages, source felloai.com model roundup, verified July 2026, but it is not infinite and things can fall out the back, so give the model the relevant material inside the conversation rather than assuming it remembers. And in a free consumer chat, never paste sensitive personal or client data, that is a POPIA risk, what you type may be stored or used to improve the service.</p><p class=\"mb-3\">The deepest lesson is a mindset. Use AI as a thinking partner, not a crutch. A crutch does the thinking for you and your own skill withers, a thinking partner argues with you, drafts with you, challenges you, while you stay the one who judges, decides and owns the result. Students who let AI write their assignments unread learn nothing and get caught. Students who debate their essay with AI and then write it themselves learn faster than any generation before them. The tool can lift you up or hollow you out, the difference is whether you keep your own mind switched on.</p>",
      "keyTerms": [
        {
          "term": "Hallucination",
          "planHtml": "when AI states something false with full confidence because it predicts plausible words rather than checking truth"
        },
        {
          "term": "Verification",
          "planHtml": "checking important AI claims against a real, trusted source before you rely on them"
        },
        {
          "term": "Context window",
          "planHtml": "the amount of text a model can hold in mind at once, large but not unlimited"
        },
        {
          "term": "Token",
          "planHtml": "a small chunk of text, roughly part of a word, the unit models read and count"
        },
        {
          "term": "Thinking partner",
          "planHtml": "using AI to challenge and sharpen your own thinking rather than to replace it"
        }
      ],
      "activityHtml": "Deliberately catch a hallucination. Ask a free AI for five facts about a niche topic you know well, your hometown, a local team, a family trade. Fact check all five against reliable sources. You will likely find at least one confident error. Write down how it was worded, notice how convincing it sounded. That memory will protect your career for years, and it cost you nothing but half an hour."
    },
    {
      "number": 9,
      "title": "The internet, the cloud, and data, where the money is made",
      "hookHtml": "Discovery, Capitec, and Takealot are not really insurance, banking, and retail companies, they are data companies wearing those clothes, and that is why they win.",
      "outcomes": [
        "Explain what the cloud is and why it changed business",
        "Describe why data is called the new oil",
        "Give South African examples of firms making and saving millions through data and cloud"
      ],
      "bodyHtml": "<p class=\"mb-3\">AI does not float in the air. It stands on three pillars, the internet, the cloud and data. Understand how these make and save companies real money and you will understand where the jobs and salaries come from, and speak the language of the people who do the hiring.</p><p class=\"mb-3\">The cloud simply means renting computing power over the internet instead of buying and running your own machines. In the old days a Cape Town company that wanted software had to buy physical servers, house them in a cooled room, employ people to babysit them, and pray during load shedding. With providers like AWS, Microsoft Azure and Google Cloud, you rent exactly what you need and pay only for what you use, like electricity from the wall instead of building your own power station, need ten times the power for Black Friday, rent it for a day and give it back. This one shift let a two person team in Woodstock rent the same world class computing a bank uses, and it is the foundation the whole modern tech economy, and every AI system, runs on.</p><p class=\"mb-3\">Data is often called the new oil, though the new soil fits better, things grow from it. Every tap, swipe, purchase and click produces it, raw material until refined. Discovery built Vitality on health and behaviour data, rewarding gym visits and healthy food, which lowers claims and raises profits, a loop worth billions of rand. Capitec uses data to run lean, keep branches simple, and score credit fast, serving millions cheaply. Takealot uses browsing and buying data to recommend products, manage stock and place warehouses. Shoprite's Xtra Savings card teaches them what to stock, where, and at what price, across thousands of stores. Vodacom and MTN sit on network data that guides where to build towers and how to price bundles.</p><p class=\"mb-3\">Two ways data makes money. It saves money by cutting waste, spotting fraud and running lean, fewer bad loans, less dead stock, fewer fraudulent claims. It makes money by finding what customers want and selling more of it, better recommendations, smarter pricing, products aimed at real behaviour. AI is the engine that turns oceans of this data into those decisions, faster and at a scale no team of humans could match, with the internet as the pipes carrying it all to the cloud. Companies are not paying for clever technology for its own sake, they are paying because data plus cloud plus AI saves them millions and earns them millions, and when you can point at a business and explain where the waste is cut or the money is made, you have started thinking like the engineers and analysts who command the best salaries.</p>",
      "keyTerms": [
        {
          "term": "The cloud",
          "planHtml": "renting computing power over the internet instead of owning your own servers, pay for what you use"
        },
        {
          "term": "Data as the new oil",
          "planHtml": "the idea that refined data is a hugely valuable raw material businesses turn into money"
        },
        {
          "term": "Efficiency saving",
          "planHtml": "money saved by cutting waste, catching fraud, and running lean using data"
        },
        {
          "term": "Cloud providers",
          "planHtml": "companies like AWS, Microsoft Azure, and Google Cloud that rent out computing power"
        }
      ],
      "activityHtml": "Pick one South African company you use often, Capitec, Takealot, Shoprite, Discovery, Vodacom. Write half a page answering three questions. What data do they collect from me. How could that data save them money. How could it help them make more money. This one exercise trains the commercial thinking that turns a technician into someone a business genuinely wants to hire."
    },
    {
      "number": 10,
      "title": "Systems thinking, seeing the whole picture",
      "hookHtml": "A junior fixes the broken part in front of them, a systems thinker asks why the part keeps breaking, and only one of them gets promoted.",
      "outcomes": [
        "Define a system in terms of parts, connections, and purpose",
        "Trace how a change in one part ripples through the whole",
        "Spot feedback loops and root causes instead of just symptoms"
      ],
      "bodyHtml": "<p class=\"mb-3\">Tools change every year. The way you think about problems can last a lifetime, and that way of thinking is systems thinking, the quiet superpower of every senior engineer, analyst and founder worth admiring.</p><p class=\"mb-3\">A system is a set of parts that connect to serve a purpose. Your body is a system, heart, lungs, blood, all connected to keep you alive. A taxi rank is a system, drivers, queues, routes, fares, marshals, all connected to move people. A company is a system, and so is any piece of software. A beginner sees a bag of separate parts, a systems thinker sees the connections between them, and understands the connections often matter more than the parts.</p><p class=\"mb-3\">First big idea, everything is connected, so a change in one place ripples elsewhere. An online store speeds up checkout to please customers, good, until the warehouse cannot pack fast enough, orders pile up, deliveries run late, reviews sour. A systems thinker asks, if I change this, what else moves, a single question that prevents a thousand expensive mistakes.</p><p class=\"mb-3\">Second big idea, feedback loops, where an effect circles back and changes its own cause. Some amplify, a popular video gets recommended more so more people watch so it gets recommended even more. Some balance, a geyser heats until a thermostat switches it off, then cools until it switches on again. Load shedding is a painful loop, low supply forces cuts, cuts hurt the economy, a weaker economy struggles to fund new supply. Spotting whether a loop amplifies or balances lets you predict how a system behaves over time.</p><p class=\"mb-3\">Third and most practical, root cause versus symptom. A website keeps crashing every evening, the junior restarts the server each night, treating the symptom, and stays busy forever. The systems thinker asks why, traffic spikes at eight when a show airs, the server cannot cope, so the real fix is capacity at peak, or cloud power that scales automatically. Treat the root and the symptom disappears, treat the symptom and you are firefighting for life. The person who calmly traces problems to their root, instead of slapping plasters on symptoms, becomes the one everyone trusts with the hard cases, and that trust is what pay rises are made of.</p>",
      "keyTerms": [
        {
          "term": "System",
          "planHtml": "a set of connected parts working toward a purpose, like a body, a company, or a piece of software"
        },
        {
          "term": "Feedback loop",
          "planHtml": "when an effect circles back to change its own cause, either amplifying it or balancing it"
        },
        {
          "term": "Root cause",
          "planHtml": "the real underlying reason a problem keeps happening, beneath the surface symptom"
        },
        {
          "term": "Ripple effect",
          "planHtml": "the way a change in one part of a system spreads to affect other parts"
        }
      ],
      "activityHtml": "Map one system you live inside, your household budget, your commute, or your study routine. On one page, list the parts, draw arrows for how they connect, and mark one feedback loop. Then pick one recurring frustration and ask why five times in a row until you reach a root cause. You will often be surprised how different the real cause is from the symptom you kept treating."
    },
    {
      "number": 11,
      "title": "Problem solving and thinking outside the box",
      "hookHtml": "The engineer who saved a company millions did not know more code than her colleagues, she just refused to accept that the problem had to be solved the usual way.",
      "outcomes": [
        "Break any big problem into smaller solvable pieces",
        "Separate the real problem from the assumed solution",
        "Generate creative options before committing to one"
      ],
      "bodyHtml": "<p class=\"mb-3\">Systems thinking helps you see the whole, problem solving is what you do once you see it, and it is the most transferable skill in technology, because every job, in data, cloud, security, software or AI, is ultimately paid to solve problems.</p><p class=\"mb-3\">Start with decomposition, breaking a big scary problem into small handleable pieces. Build an app for my studio freezes a beginner because the whole thing is too large to hold, a problem solver chops it down, a piece for clients to see your portfolio, a piece to book a slot, a piece to take payment, a piece to send confirmations. Four ordinary tasks instead of one monster, each choppable again until every piece is small enough to actually start, exactly how professionals eat an elephant, one bite at a time.</p><p class=\"mb-3\">Second, separate the problem from the solution, because we jump to solutions far too fast. Someone says, I need an app, but the real problem might be, my clients cannot reach me after hours, and a simple WhatsApp Business auto reply solves that tonight for free. Ask what is the actual problem here, stripped of any assumed answer, often via the five whys from the last module, and you find a cheaper, faster, better path before you choose how to solve it.</p><p class=\"mb-3\">Third, thinking outside the box, a discipline, not woolly daydreaming, deliberately questioning the assumptions everyone treats as fixed. We have always done bookings by phone, what if we did not. Customers wait too long, what if we removed the queue entirely with pre booking instead of just serving faster. Borrow from another field, how does a busy restaurant handle a rush. Creativity here is a set of moves you practise on purpose, never fall in love with your first idea, force out three more, then choose.</p><p class=\"mb-3\">Put the moves together. Understand the real problem, not the assumed solution. Break it into small pieces. Generate several ways to solve each piece. Try the smallest version, see what happens, adjust. This loop is exactly how the best engineers work, and exactly how you can start working today, on your studies, your side hustle, your money, long before anyone hands you a technical title.</p>",
      "keyTerms": [
        {
          "term": "Decomposition",
          "planHtml": "breaking a big problem into small pieces you can actually start on, one bite at a time"
        },
        {
          "term": "Problem versus solution",
          "planHtml": "the discipline of naming the real need before assuming the answer, which often reveals a cheaper path"
        },
        {
          "term": "Questioning assumptions",
          "planHtml": "deliberately challenging the invisible rules everyone treats as fixed, the core of thinking outside the box"
        },
        {
          "term": "Option generation",
          "planHtml": "forcing out several possible solutions before committing, instead of grabbing the first idea"
        }
      ],
      "activityHtml": "Take one real problem you have right now and run the full method on paper. State the true problem after asking why a few times. Break it into at least three pieces. For one piece, brainstorm four different solutions, including one deliberately unusual one. Pick the smallest thing you could try this week. You have just done, for free, the exact thinking a paid problem solver does every day."
    },
    {
      "number": 12,
      "title": "Choosing your track, where do you go from here",
      "hookHtml": "You now understand the machine, the maths, the skills, and the thinking, so the last question is simple, which door do you want to walk through.",
      "outcomes": [
        "Name the main tech career tracks and what each one does",
        "Match your own strengths and interests to a track",
        "Plan a first free, concrete step toward the track you choose"
      ],
      "bodyHtml": "<p class=\"mb-3\">Look how far you have climbed. You started not knowing what AI was, now you can place any system on the ladder, explain the maths in human terms, prompt and verify like a professional, reason honestly about how models think, see the whole system, and solve problems in a structured way. The specific tools are the easy part now, because you have the thinking that makes any tool make sense. This final module points you at the doors.</p><p class=\"mb-3\">Five tracks, cousins not rivals, you can move between them over a career. The data track turns raw data into decisions, analysts find the story in the numbers and build the dashboards a manager reads on Monday, engineers build the pipelines that move and clean data at scale, the plumbing beneath every Capitec or Takealot decision we discussed. The cloud track builds and runs systems on rented computing power, engineers set up servers, storage and networks on AWS, Azure or Google Cloud and keep them reliable and affordable, which matters enormously where uptime and cost discipline are daily battles.</p><p class=\"mb-3\">The security track protects systems and data from attackers, a legal duty in the POPIA era, thinking like both a builder and a burglar to find weak spots before criminals do, and demand for it keeps climbing. The software track builds the apps and websites people use, from a studio's booking site to a banking app used by millions, turning ideas into working products. The AI track, newest of the five, builds intelligent systems on top of the others, models, agents, and the tools this course explored, and draws on data, cloud and software together, which is why so many AI engineers arrive from one of the other tracks first.</p><p class=\"mb-3\">You do not have to choose perfectly, or today. Pick the track whose module lit you up most and take one small free step, an introductory course, a beginner project, a community. In South Africa look at free platform introductions, local communities, and the OfferZen blog and MyBroadband forums where people share exactly how they broke in. Chase the work that pulls you, the person who enjoys the climb always outlasts the person chasing only the rand figure. Choose a door, take the first step, and keep the mindset you built here switched on, that mindset, not any single tool, is what carries your whole career.</p>",
      "keyTerms": [
        {
          "term": "Data track",
          "planHtml": "turning raw data into decisions, as an analyst who tells the story or an engineer who builds the pipelines"
        },
        {
          "term": "Cloud track",
          "planHtml": "building and running reliable, affordable systems on rented computing power like AWS or Azure"
        },
        {
          "term": "Security track",
          "planHtml": "protecting systems and data from attackers, a legal duty under POPIA and a fast growing field"
        },
        {
          "term": "Software track",
          "planHtml": "building the apps and websites people actually use, turning ideas into working products"
        },
        {
          "term": "AI track",
          "planHtml": "building intelligent systems, models and agents, usually after mastering data, cloud, or software first"
        }
      ],
      "activityHtml": "Rank the five tracks from most to least exciting for you, and write one honest sentence on why the top one pulls you. Then find one free first step for it this week, a free intro course, a beginner tutorial, or a local community to join, and diarise a single hour to start it. A career begins not with a big decision but with one small step actually taken, and this one is free."
    }
  ],
  "shortcourse": [
    {
      "number": 1,
      "title": "What AI actually is, in plain language",
      "hookHtml": "You already used AI three times before breakfast, you just did not call it that.",
      "outcomes": [
        "Explain what AI is to a friend in one sentence",
        "Tell the difference between narrow AI and the general AI of the movies",
        "Name what ChatGPT, Claude, Gemini and Meta AI each are and do"
      ],
      "bodyHtml": "<p class=\"mb-3\">Clear the fog first. AI, artificial intelligence, is software that does tasks we used to think needed a human brain, understanding a sentence, spotting a face, writing a paragraph. No robot uprising, no magic. When your phone unlocks by looking at you, when Netflix guesses your next series, when your bank flags a strange purchase in Sandton while your card is in Cape Town, that is AI quietly working.</p><p class=\"mb-3\">The kind everyone talks about in 2026 is <strong class=\"font-semibold text-slate-900\">generative AI</strong>, which makes new things, a paragraph, an image, a summary, some code, rather than just sorting or predicting. The engine underneath is a <strong class=\"font-semibold text-slate-900\">large language model</strong>, or LLM, trained by reading an enormous amount of text until it becomes very good at predicting what words come next, like a friend who has read almost every book in the library and can hold a conversation about any of them.</p><p class=\"mb-3\">The levels matter. <strong class=\"font-semibold text-slate-900\">Narrow AI</strong> does one job well, every tool you can use today is narrow AI, even the clever chat ones. <strong class=\"font-semibold text-slate-900\">Artificial general intelligence</strong>, AGI, would match a human across almost any task, and does not exist yet, no matter what a LinkedIn post tells you. <strong class=\"font-semibold text-slate-900\">Superintelligence</strong> would go beyond us, and lives in films for now. When someone says AI will take every job tomorrow, remember we are firmly in the narrow era, powerful but limited, a set of tools, not a colleague.</p><p class=\"mb-3\">Meet the big four you will actually touch. <strong class=\"font-semibold text-slate-900\">ChatGPT</strong>, from OpenAI, is the household name, a great all rounder. <strong class=\"font-semibold text-slate-900\">Claude</strong>, from Anthropic, is strong at careful writing, long documents and reasoning. <strong class=\"font-semibold text-slate-900\">Gemini</strong>, from Google, plugs into Search, Gmail and Docs with a generous free tier. <strong class=\"font-semibold text-slate-900\">Meta AI</strong> lives inside WhatsApp, Instagram and Facebook, free with no paid tier. All four have a free version good enough to learn on today, so you do not need to spend a rand to start. One fair caution, these tools sound confident even when wrong, and free tiers cap daily use, both covered in later modules. For now, hold this shift in your head, AI is not a brain that knows things, it is a tool that predicts and generates, a very fast, very well read assistant that still needs your judgement.</p>",
      "keyTerms": [
        {
          "term": "Artificial intelligence (AI)",
          "planHtml": "Software that does tasks we used to think needed a human brain."
        },
        {
          "term": "Generative AI",
          "planHtml": "AI that creates new content like text, images or code, instead of just sorting or predicting."
        },
        {
          "term": "Large language model (LLM)",
          "planHtml": "The engine behind chat tools, trained on huge amounts of text to predict the next words."
        },
        {
          "term": "Narrow AI",
          "planHtml": "AI that is good at one job. Everything available today is this kind."
        },
        {
          "term": "AGI (artificial general intelligence)",
          "planHtml": "A hypothetical AI that could match a human across almost any task. Not here yet."
        }
      ],
      "activityHtml": "Open the free version of any one of ChatGPT, Claude, Gemini or Meta AI in WhatsApp today. Ask it to explain load shedding to a ten year old. Notice how it responds, then ask it to make the answer shorter. You just used generative AI and iterated on it, which is the whole game."
    },
    {
      "number": 2,
      "title": "Using AI tools well, prompting like a pro",
      "hookHtml": "The same tool gives one person a useless blob and another person a job winning cover letter. The difference is not the tool.",
      "outcomes": [
        "Choose the right AI tool for a given task",
        "Write a clear prompt using role, task, context and format",
        "Improve any answer by iterating instead of starting over"
      ],
      "bodyHtml": "<p class=\"mb-3\">Most people meet AI, type three lazy words, get a bland answer, and conclude it is overhated. The truth is closer to cooking, give a good chef a vague order, get a random plate. Tell them who it is for, what you want, and how you like it, and the meal changes completely. Prompting is just telling the tool clearly what you want.</p><p class=\"mb-3\"><strong class=\"font-semibold text-slate-900\">Choosing a tool.</strong> For everyday writing and questions, any of the big four works. For long documents, careful reasoning or study notes, Claude shines. For anything tied to your Gmail and Docs, Gemini is handy. For quick help without leaving your chats, Meta AI inside WhatsApp is the lowest effort option in South Africa, already on your phone. Pick one, learn it well, switch only when it lets you down.</p><p class=\"mb-3\">The heart of it, a recipe called <strong class=\"font-semibold text-slate-900\">role, task, context, format</strong>. Give the AI a role, the task, the context it needs, and the format you want back. Weak, please write a business email. Strong, you are my assistant, write a short, polite email to a Cape Town client, Mr Dlamini, telling him his logo design is ready and the invoice for R2 500 is attached, keep it warm and under one hundred words. The second gives the tool everything it needs, so it gives you something you can almost send as is.</p><p class=\"mb-3\">Three habits raise your results fast. <strong class=\"font-semibold text-slate-900\">Be specific</strong>, numbers, names, tone and length beat vague wishes. <strong class=\"font-semibold text-slate-900\">Give an example</strong> of what good looks like, even a rough one, the tool copies patterns well. <strong class=\"font-semibold text-slate-900\">Iterate</strong>, the skill almost nobody uses, do not accept the first answer or start over, just reply, make it shorter, or add a line about our load shedding backup, and the tool keeps the thread and adjusts. And when unsure how to ask, ask the tool to help you ask, type, before you answer, ask me any questions you need to give a great result, and it interviews you until the final answer fits your situation. Great prompting is clarity plus a willingness to go back and forth two or three times.</p>",
      "keyTerms": [
        {
          "term": "Prompt",
          "planHtml": "The instruction or question you type to an AI tool."
        },
        {
          "term": "Role, task, context, format",
          "planHtml": "A simple prompt recipe, tell the AI who to be, what to do, what it needs to know, and how to reply."
        },
        {
          "term": "Iterating",
          "planHtml": "Refining an answer with follow up messages instead of starting a new chat each time."
        },
        {
          "term": "Context",
          "planHtml": "The background details you give the tool so its answer fits your real situation."
        }
      ],
      "activityHtml": "Pick a real task you have this week, a message to a landlord, a study summary, a caption. Write it with the role, task, context, format recipe. Then send two follow up messages to improve the answer, one about tone and one about length. Save the before and after so you can see the jump."
    },
    {
      "number": 3,
      "title": "Trusting AI, hallucinations, facts and your privacy",
      "hookHtml": "AI will look you dead in the eye and invent a court case that never happened. Confidently.",
      "outcomes": [
        "Recognise a hallucination and check a claim before you rely on it",
        "Decide what information is safe to paste and what is not",
        "Apply basic POPIA thinking to protect yourself and others"
      ],
      "bodyHtml": "<p class=\"mb-3\">The single most important lesson in this course. AI does not know things, it predicts words that sound right, usually right sounding and true line up, sometimes they do not, and the tool invents a fact, a source, a statistic or a quote with total confidence. We call this a <strong class=\"font-semibold text-slate-900\">hallucination</strong>, not a bug you can switch off, baked into how these tools work. In 2023 two lawyers were fined in a real United States court after filing fake cases ChatGPT had made up. They trusted, they did not check, and it cost them.</p><p class=\"mb-3\">Build one reflex, <strong class=\"font-semibold text-slate-900\">trust but verify</strong>. Use AI to draft, brainstorm and explain, then confirm anything that matters against a real source before you act, names, dates, prices, laws, medical and financial claims, statistics. A good test, would it embarrass me or cost me money if this were wrong, if yes, check it against a quick web search, an official site like SARS or your bank, or a person who actually knows. The tool is a brilliant first draft, never the final word.</p><p class=\"mb-3\">Now privacy, where South Africans need to be sharp. Pasting something into a free AI tool is like handing a note to a stranger, you do not fully control where it goes, and some tools may use your chats to improve their systems. Never paste an ID number, bank or card detail, password, medical record, client list, or anything about another person that is not yours to share.</p><p class=\"mb-3\">That last point is the law, not just manners. <strong class=\"font-semibold text-slate-900\">POPIA</strong>, South Africa's privacy law, says personal information must be handled with care and a lawful reason. Paste your customer database into a chatbot to write a newsletter and you may be breaking it, that is other people's personal information leaving your control. The safe habit, <strong class=\"font-semibold text-slate-900\">anonymise before you paste</strong>, swap real names and numbers for placeholders like Client A and R2 500, get your draft, then fill the real details back in yourself. You keep the speed of AI and you keep people's trust.</p>",
      "keyTerms": [
        {
          "term": "Hallucination",
          "planHtml": "When AI states something false as if it were true, including fake facts, sources or quotes."
        },
        {
          "term": "Trust but verify",
          "planHtml": "Use AI to draft, then confirm anything important against a real, reliable source."
        },
        {
          "term": "POPIA",
          "planHtml": "South Africa's privacy law, the Protection of Personal Information Act, which governs handling people's personal data."
        },
        {
          "term": "Anonymise",
          "planHtml": "Swap real names and numbers for placeholders before pasting, then add the real details back yourself."
        }
      ],
      "activityHtml": "Ask an AI tool for five statistics about unemployment in South Africa, with sources. Then try to verify two of them on the Stats SA website or a news site. Notice which check out and which do not. This one exercise will change how you use AI forever."
    },
    {
      "number": 4,
      "title": "AI for your life and work, real South African wins",
      "hookHtml": "A matric pupil, a spaza shop owner and someone hunting a job walk into a chatbot. All three walk out ahead.",
      "outcomes": [
        "Use AI to write a CV, a cover letter and professional emails",
        "Turn AI into a patient private tutor for any subject",
        "Plan tasks, budgets and small business content with AI"
      ],
      "bodyHtml": "<p class=\"mb-3\">Enough theory. Let us put AI to work for three South Africans you might recognise, because the point of being AI literate is a better week, not a certificate on a wall.</p><p class=\"mb-3\"><strong class=\"font-semibold text-slate-900\">The job seeker.</strong> Unemployment here is brutal, and a strong application is your edge. Paste a job advert and your rough experience, ask for a CV tailored to this role and a cover letter that sounds like a real person, then iterate, make it fit one page, add my volunteer work at church. Ask it to list likely interview questions and run a mock interview with you over chat, rehearsing for a Shoprite management post or a junior developer role at midnight, for free, as many times as you need.</p><p class=\"mb-3\"><strong class=\"font-semibold text-slate-900\">The student.</strong> AI is the most patient tutor you will ever meet, never sighing when you ask again. Stuck on the Krebs cycle or quadratic equations, ask it to explain like I am fifteen, then quiz me until I get it. Feed it your notes for a summary, flashcards, or a study timetable that works around load shedding. One rule, use it to understand, not to hand in its words as yours, ask it to teach you the method, then solve the next one on your own.</p><p class=\"mb-3\"><strong class=\"font-semibold text-slate-900\">The small business owner</strong>, the spaza, the salon, the studio. This is where AI feels like hiring an assistant you cannot afford yet, drafting WhatsApp promos and Instagram captions in your voice, replying calmly to a complaint, building a monthly budget or a client quote from a description, writing your POPIA privacy note, planning a week of content in ten minutes. A one person operation in Tableview can suddenly present like a small team, look sharp, spend little.</p><p class=\"mb-3\">The thread through all three is the same. AI removes the blank page and the boring admin, so your time goes to the parts only you can do, the sale, the relationship, the actual studying. Start with one annoying task this week and hand it over.</p>",
      "keyTerms": [
        {
          "term": "Tailoring",
          "planHtml": "Adjusting a CV or message to fit one specific job or person instead of sending the same generic one."
        },
        {
          "term": "Mock interview",
          "planHtml": "A practice interview, here run by an AI over chat so you can rehearse answers for free."
        },
        {
          "term": "Prompt in your voice",
          "planHtml": "Asking AI to write the way you speak, so captions and replies still sound like you."
        }
      ],
      "activityHtml": "Choose the persona closest to you, seeker, student or owner. Do the one task named above for real, a tailored CV, a quizzed study topic, or a week of captions. Use it in your actual life this week, not as a drill. That is the moment AI stops being a buzzword and becomes your unfair advantage."
    },
    {
      "number": 5,
      "title": "Where next, free certificates and your path forward",
      "hookHtml": "You are now more AI literate than most working adults. Here is how to prove it and where it can take you.",
      "outcomes": [
        "Enrol in a genuinely free, respected AI course this week",
        "Understand the beginner AI career paths and what they pay direction",
        "See how this crash course bridges into the full SpaniSpace bootcamp"
      ],
      "bodyHtml": "<p class=\"mb-3\">Well done, you made it. You can explain AI, prompt it well, catch its lies, protect your data, and put it to work, real literacy most people around you do not have yet. Now let us turn momentum into proof and a plan.</p><p class=\"mb-3\">Start with a <strong class=\"font-semibold text-slate-900\">free certificate</strong>, it costs only your evenings and looks good on LinkedIn and a CV. As of July 2026, a few stand out. <strong class=\"font-semibold text-slate-900\">Elements of AI</strong>, University of Helsinki, free, beginner friendly, globally respected, taught over a million people. <strong class=\"font-semibold text-slate-900\">Google AI Essentials</strong> on Coursera, about ten hours, no technical background needed, use the audit or financial aid option to avoid a fee. <strong class=\"font-semibold text-slate-900\">Microsoft and LinkedIn</strong> short courses drop a Microsoft badge straight onto your profile. <strong class=\"font-semibold text-slate-900\">Kaggle Learn</strong> is completely free with certificates for the hands on data side. Pick one, block two evenings a week, finish it. Sources, <a href=\"https://beginnersinai.org/free-ai-courses-with-certificates/\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-indigo-600 underline hover:text-indigo-800\">Beginners in AI, best free AI courses with certificates 2026</a> and <a href=\"https://www.coursera.org/specializations/ai-essentials-google\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-indigo-600 underline hover:text-indigo-800\">Google AI Essentials on Coursera</a>, both checked July 2026.</p><p class=\"mb-3\">The <strong class=\"font-semibold text-slate-900\">career map</strong>, in plain terms. The gentlest on ramp is becoming the person at your workplace who uses AI well, an <strong class=\"font-semibold text-slate-900\">AI literate professional</strong>, often the first noticed for growth. One step further, a <strong class=\"font-semibold text-slate-900\">prompt or AI operations</strong> role, wiring these tools into how a business runs. Beyond that, the technical roles that need real study, <strong class=\"font-semibold text-slate-900\">data analyst</strong>, then <strong class=\"font-semibold text-slate-900\">data scientist</strong> and <strong class=\"font-semibold text-slate-900\">AI engineer</strong>, the path our own Brendon walked, well paid and in demand on platforms like OfferZen, but months of real learning, not a weekend. Check exact salary figures live on OfferZen or MyBroadband before you bank on them, they move.</p><p class=\"mb-3\">Which brings us to the bridge. This crash course made you confident and useful in days. The <strong class=\"font-semibold text-slate-900\">full SpaniSpace bootcamp</strong> is where confident becomes qualified, structure, projects and support that take you from using AI to building with it. Finish one free certificate, keep using AI on real tasks for two weeks, and notice whether you are hungry for more. If you are, the bootcamp is your next door, and you will walk in already ahead of the room.</p>",
      "keyTerms": [
        {
          "term": "Free certificate",
          "planHtml": "A course completion badge you earn at no cost, useful on your CV and LinkedIn."
        },
        {
          "term": "AI literate professional",
          "planHtml": "Someone in any job who uses AI tools well, often the most productive person on the team."
        },
        {
          "term": "Data analyst, data scientist, AI engineer",
          "planHtml": "A ladder of technical AI careers, higher paying but needing months of proper study."
        },
        {
          "term": "Bootcamp",
          "planHtml": "A structured, hands on training programme that takes you from using AI to building with it."
        }
      ],
      "activityHtml": "Enrol in Elements of AI or Google AI Essentials today, it is free, and complete the first lesson before you close your laptop. Then write one sentence on where you want AI to take you, at school, at work, or in a side hustle. That sentence is the start of your path into the full bootcamp."
    }
  ],
  "mentorship": [
    {
      "number": 1,
      "title": "Program foundations and engineering standards",
      "eyebrow": "Before Week 1",
      "hookHtml": "Before a single line of feature code gets written, this program sets the engineering standards every repository must meet, because the habits you form in week one are the habits that end up in production for the rest of your career.",
      "outcomes": [
        "List the mandatory engineering standards every repo in this program must meet before work begins",
        "Explain GitHub Flow and why nobody, ever, commits straight to main",
        "Describe what DevSecOps first means in practice, not just as a buzzword",
        "Read the 12 week roadmap and know which phase you are in at any point",
        "Explain why a finished project ships with a public repo, a LinkedIn post and a presence on other platforms, not just working code"
      ],
      "bodyHtml": "<p class=\"mb-3\">This is a 12 week mentoring framework built to move a graduate from academic foundation to industry ready engineer. It is DevSecOps first, it uses enterprise software patterns, and every deliverable is built to double as a real portfolio piece, something you can point a hiring manager to and say, I built that, here is why I made these choices.</p><p class=\"mb-3\">Before week one starts, every repository created during the program has to meet the same baseline, no exceptions, because a standard you only sometimes apply is not a standard, it is a suggestion.</p><ul class=\"list-disc pl-5 my-3 space-y-1\"><li><strong class=\"font-semibold text-slate-900\">Version control and flow.</strong> GitHub Flow, meaning a main branch, a develop branch, and feature branches. No direct commits to main, ever. Every change lands through a Pull Request with a mandatory review, commit messages follow a lint standard, and releases are tagged with semantic versioning like v1.0.0.</li><li><strong class=\"font-semibold text-slate-900\">DevSecOps first.</strong> Secret scanning runs on every push, through GitHub Advanced Security or TruffleHog. Snyk or Dependabot watches your dependencies. Docker images are scanned for vulnerabilities with Trivy, wired into CI/CD, not run by hand afterwards.</li><li><strong class=\"font-semibold text-slate-900\">Agile management.</strong> Progress lives on a GitHub Projects Kanban board, in weekly sprints, with story point estimates and a weekly pull request review, so work is visible before it is finished, not only after.</li><li><strong class=\"font-semibold text-slate-900\">Documentation standard.</strong> Every project ships an architecture diagram in Mermaid.js or Draw.io, a README that stays true as the project changes, an OpenAPI or Swagger spec for any API, and a one command setup, a Makefile or a docker-compose up.</li><li><strong class=\"font-semibold text-slate-900\">Ship publicly, every time.</strong> No project is finished the moment the code works. Every repository is pushed to a public GitHub, never left private on your laptop, every completed project gets a LinkedIn post written for a non-technical reader, and a mention on at least one other platform, a portfolio site, X, Dev.to, an OfferZen profile. A brilliant project nobody sees does nothing for your career, visibility is graded the same as the code.</li></ul><p class=\"mb-3\">The 12 weeks break into five phases. Weeks 1 to 3 build the foundation, no product work yet. Weeks 4 to 6 deliver Project 1, a personalization and events engine. Weeks 7 to 9 deliver Project 2, a full multi tenant enterprise system. Weeks 10 and 11 add production scale and one more project of your choosing. Week 12 is career engineering, turning three months of work into a GitHub profile, a LinkedIn presence and interview readiness a recruiter takes seriously on sight.</p><p class=\"mb-3\">Notice what is missing, a week for tutorials. This program assumes you can already write code. What it teaches is the layer most bootcamps skip, the standards, the pipeline, and the professional habits that separate a working prototype from something a company would actually let into production.</p>",
      "keyTerms": [
        {
          "term": "GitHub Flow",
          "planHtml": "a lightweight branching model, main plus develop plus short lived feature branches, merged only through a reviewed Pull Request"
        },
        {
          "term": "DevSecOps",
          "planHtml": "security folded into the development pipeline itself, secret scanning and dependency and container checks on every push, not a separate step done later"
        },
        {
          "term": "Semantic versioning",
          "planHtml": "a version number like v1.0.0 where each part tells you whether a change is a fix, a new feature, or a breaking change"
        },
        {
          "term": "Build in public",
          "planHtml": "sharing your work as you build it, a public repo, a LinkedIn post, a portfolio update, instead of only revealing it once it is finished"
        }
      ],
      "activityHtml": "Before you write a single feature, stand up the scaffolding. Create a GitHub organisation, protect the main branch so it rejects direct commits and requires a PR review, turn on Dependabot, and open a GitHub Projects Kanban board with your weeks 1 to 3 tasks already on it. Do this first, every time, for every project in this program."
    },
    {
      "number": 2,
      "title": "DevSecOps, Agile and cloud foundation",
      "eyebrow": "Weeks 1-3",
      "hookHtml": "The first three weeks build no product at all, they build the pipeline, the container and the cloud account that every later week depends on, and a shaky foundation here means rebuilding it under pressure in week eight.",
      "outcomes": [
        "Stand up a CI/CD pipeline that lints, tests and builds on every pull request",
        "Containerise an application with Docker and scan it for vulnerabilities with Trivy",
        "Provision cloud infrastructure on a free tier without leaving a security hole open",
        "Fold an AI coding workflow into your daily engineering habits, deliberately, not by accident"
      ],
      "bodyHtml": "<p class=\"mb-3\">Phase 1 runs weeks 1 through 3, and its whole job is foundation, not features. The focus areas are CI/CD pipelines, containerisation, cloud infrastructure on the free tier, code quality gates, and folding AI tools into your actual workflow rather than using them as a novelty.</p><p class=\"mb-3\">The milestones for this phase are concrete and checkable. Set up the GitHub organisation for the cohort. Establish the PR review rules, at minimum one approving review before merge, and branch protection on main. Configure automated testing, linting and vulnerability scanning so they run on push, not on demand. By the end of week 3, nobody should be able to merge a broken, unlinted, unscanned change into main, because the pipeline will not let them.</p><p class=\"mb-3\">This is deliberately the least glamorous phase of the program, and that is the point. A pipeline that catches a leaked API key or an outdated dependency on day one is worth more than a slick feature shipped on top of a foundation that cannot be trusted. Every project after this phase, the RSVP platform, the Sunday School system, the capstone, inherits whatever discipline gets built here. Skimp on it now and you pay for it in week nine, under a deadline, with a real bug in front of you.</p><p class=\"mb-3\">Practically, that means every graduate leaves this phase with a working GitHub Actions workflow that runs on every pull request, a Dockerfile for at least one service, a Trivy scan wired into that same workflow, and a cloud account, AWS, Render or Fly.io on its free tier, provisioned with least privilege access rather than a single all powerful key.</p>",
      "keyTerms": [
        {
          "term": "CI/CD pipeline",
          "planHtml": "an automated sequence that lints, tests, builds and deploys your code every time you push, so a human never has to remember to do it"
        },
        {
          "term": "Container security scanning",
          "planHtml": "checking a Docker image for known vulnerabilities, with a tool like Trivy, before it ever reaches a server"
        },
        {
          "term": "Secret scanning",
          "planHtml": "automatically catching an API key, password or token accidentally committed to a repository, before it becomes a public leak"
        }
      ],
      "activityHtml": "On a throwaway repository, build a GitHub Actions pipeline that lints, runs tests, builds a Docker image and scans that image with Trivy on every pull request, and configure branch protection so a PR cannot merge unless every one of those checks passes."
    },
    {
      "number": 3,
      "title": "Project 1: the personalization and events engine",
      "eyebrow": "Weeks 4-6",
      "hookHtml": "Project 1 is a high throughput RSVP and event platform, the kind of system that has to survive a thousand guests opening their personalised invite at the same moment, and building it is how you learn caching, tokens and mobile first design for real.",
      "outcomes": [
        "Build tokenised, personalised landing pages instead of one generic page for everyone",
        "Generate a verifiable QR code and a real time check in dashboard",
        "Add rate limiting and basic anti bot protection to a public facing endpoint",
        "Ship a mobile first Progressive Web App that a guest can use from a browser, no app store",
        "Publish the finished platform: a public GitHub repo, a LinkedIn post, and a mention on at least one other platform"
      ],
      "bodyHtml": "<p class=\"mb-3\">Project 1 is the Hyper Personalized RSVP and Event Platform, a high throughput event management engine built to handle dynamic guest invitations, customised QR entry, and personalised attendee dashboards. Organisers create custom events, send multi channel invitations by email, SMS or WhatsApp, and let guests RSVP with dynamic preferences, dietary needs, seating requests, custom questions. The platform then generates a branded calendar invite and a secure, verifiable QR code for on site check in.</p><p class=\"mb-3\">The key features to build are dynamic, personalised guest landing pages driven by unique tokenised URLs, so no two guests see a generic form, they see their own name and their own event context the moment the page loads. Automated pass generation follows, a PDF, an Apple Wallet pass, or a dynamic branded image card. A real time check in dashboard uses the mobile browser's own camera to scan QR codes as guests arrive. And because this endpoint is public by design, it needs rate limiting and basic anti bot protection from day one, not bolted on after the first abuse report.</p><p class=\"mb-3\">The suggested stack: Next.js and Tailwind on the frontend, built mobile first as a PWA, Node.js in TypeScript or Go on the backend, PostgreSQL for storage and Redis for caching and rate limiting. For infrastructure, AWS Lambda or Vercel serverless functions, Resend or SendGrid for the invitation emails, and Supabase or Neon on their free tiers for the database. DevOps and security follow the same pattern as phase 1, GitHub Actions, Snyk, Docker, with Cloudflare's free tier in front for basic protection.</p><p class=\"mb-3\">What you actually learn building this: token based authentication with no login form, dynamic image and file rendering on demand, edge caching so a page loads fast under a spike of guests all opening their invite at once, rate limiting, and mobile first design that has to work on a guest's phone at the door.</p><p class=\"mb-3\"><strong class=\"font-semibold text-slate-900\">Before you call Project 1 done.</strong> Push the repository to a public GitHub with the module one README standard. Write a LinkedIn post that walks a non-technical reader through what the platform does, a screenshot or short screen recording helps, and put it in front of people who are not already following you, a developer group, your portfolio site, or X. The graduate who posts after every project is the one a recruiter has half met by week twelve.</p>",
      "keyTerms": [
        {
          "term": "Tokenised URL",
          "planHtml": "a link containing a unique, hard to guess code that identifies one specific guest, used instead of a login for a low friction personalised page"
        },
        {
          "term": "Rate limiting",
          "planHtml": "capping how many requests one source can make in a given window, so a public endpoint cannot be hammered or scraped without limit"
        },
        {
          "term": "Progressive Web App",
          "planHtml": "a website built to behave like an app on a phone, installable, fast, and usable without going through an app store"
        }
      ],
      "activityHtml": "Before moving on to phase 3, build the RSVP flow end to end for one fake event, tokenised link, dynamic landing page, QR generation, and check it into a live check in dashboard, deployed on a free tier host, not just running on localhost. Then push it to a public GitHub repo, write the LinkedIn post, and share it on one other platform before you call it done."
    },
    {
      "number": 4,
      "title": "Project 2: the multi tenant enterprise system",
      "eyebrow": "Weeks 7-9",
      "hookHtml": "Project 2 trades a single fast feature for a genuinely complex domain, a Sunday School library and management platform with real RBAC, real parental consent, and an AI moderation pipeline that has to catch a problem before it ever reaches the database.",
      "outcomes": [
        "Design role based access control for a system with several distinct user types",
        "Model an age based lifecycle, automatic flags and transitions, in a relational schema",
        "Wire an AI moderation pipeline into a form so unsafe content never gets saved in the first place",
        "Build a secure parent facing dashboard linked to one or more dependents",
        "Publish the finished platform: a public GitHub repo, a LinkedIn post, and a mention on at least one other platform"
      ],
      "bodyHtml": "<p class=\"mb-3\">Project 2 is the Multi Tenant Sunday School Library and Management Platform, an enterprise grade, domain driven system combining user administration, learning management, event scheduling and parental controls, with strict data handling because real children's data runs through it.</p><p class=\"mb-3\">It is a complete administrative and educational portal for a youth organisation. It handles child onboarding, age based automatic progression, parental consent capture, resource distribution, and a community forum with safety moderation built in from the start, not added after an incident.</p><p class=\"mb-3\">The key features: a youth and student lifecycle that auto registers a young person, manages their age group, and automatically flags a student for a transition workflow once they turn 16. A learning and resources portal that streams media and documents restricted by age group, with progressive tracking of completed modules. A parent space, a secure dashboard linked to their own dependents, handling consent forms, attendance records and direct messaging. And a safety and moderation forum, peer support with automated AI moderation filtering inappropriate content and personal information before it ever reaches the database.</p><p class=\"mb-3\">Suggested stack: React or Next.js on the frontend, or Flutter if you want one codebase across mobile and web. Backend in Spring Boot, Python FastAPI or NestJS, whichever you have not tried yet, this program rewards stretching. PostgreSQL for the relational hierarchies this domain needs, plus Firebase Cloud Messaging for push notifications. AI integration through the OpenAI or Anthropic API for real time text moderation and automated resource tagging. Infrastructure on Render, Supabase or AWS free tier, with Cloudflare R2 or AWS S3 for resource storage.</p><p class=\"mb-3\">What this project actually teaches: advanced RBAC across several distinct roles, relational schema design for genuine hierarchies, not a flat users table, scheduled jobs for the age based transitions, a moderation pipeline that runs before a write, not after, and child data protection patterns you cannot fake your way through.</p><p class=\"mb-3\"><strong class=\"font-semibold text-slate-900\">Before you call Project 2 done.</strong> This is the most complex system you have built so far, so say so publicly. Push it to GitHub, write a LinkedIn post explaining the RBAC and moderation decisions in plain language, and share it beyond your existing network, a portfolio site, a community, X. Explained clearly, it is exactly the post that gets a recruiter to click through to your profile.</p>",
      "keyTerms": [
        {
          "term": "RBAC",
          "planHtml": "role based access control, deciding what a user can see or do based on their assigned role, parent, admin, moderator, rather than checking each user individually"
        },
        {
          "term": "Multi tenant",
          "planHtml": "one system serving several separate organisations or groups, each with their own data kept apart from the others"
        },
        {
          "term": "Content moderation pipeline",
          "planHtml": "an automated check, often AI assisted, that screens submitted content for unsafe material before it is stored, not after"
        }
      ],
      "activityHtml": "Before writing a single migration, design the relational schema on paper or in a tool like dbdiagram.io, users, dependents, age groups, consent records and forum posts, and get someone else to read it back to you and point out the relationship you missed. When the platform is finished, push it to a public GitHub repo, write the LinkedIn post, and share it on one other platform before you call it done."
    },
    {
      "number": 5,
      "title": "Production scale: choose your capstone",
      "eyebrow": "Weeks 10-11",
      "hookHtml": "The last technical stretch of the program is where you pick a direction, an AI powered code review bot that lives inside GitHub's own workflow, or a real time incident and status page system built for reliability, and either one forces you to think in systems, not screens.",
      "outcomes": [
        "Verify a GitHub webhook with an HMAC signature so only GitHub can trigger your automation",
        "Orchestrate a static analysis plus AI review pipeline that comments directly on a pull request",
        "Or, build a concurrent monitoring worker and push real time status updates over WebSocket or SSE",
        "Export metrics in a standard, tool readable format such as Prometheus",
        "Publish the finished capstone: a public GitHub repo, a LinkedIn post, and a mention on at least one other platform"
      ],
      "bodyHtml": "<p class=\"mb-3\">Weeks 10 and 11 focus on production scale, cloud native deployment, observability and, for this stretch, a choice between two new projects, an automated developer tooling bot or a real time monitoring system. Both are deliberately systems level, not another CRUD screen.</p><p class=\"mb-3\"><strong class=\"font-semibold text-slate-900\">Project 3, the AI Powered Smart Code Review and DevSecOps Assistant.</strong> An automated tool that listens to Pull Request webhooks, runs static analysis, ESLint, SonarQube, Trivy, passes the diff through an AI model for context aware review, and comments structured feedback straight onto the PR. Key features: GitHub webhook integration with HMAC signature validation, a multi stage pipeline combining static analysis with AI suggested improvements, automated PR summaries and changelog generation, and OWASP Top 10 style security flagging. Stack: Python or TypeScript, the GitHub REST or GraphQL API, Docker, the OpenAI or Claude API, LangChain or LlamaIndex for orchestration, deployed on AWS Lambda or Cloudflare Workers. Build this and you learn webhooks properly, OAuth apps, system automation, LLM orchestration, and parsing security tool output programmatically rather than just reading it in a terminal.</p><p class=\"mb-3\"><strong class=\"font-semibold text-slate-900\">Project 4, the Real Time Incident Management and Status Page System.</strong> A microservices based monitoring engine that pings HTTP or gRPC endpoints on an interval, records latency and uptime, auto detects outages, and pushes real time alerts to a public status dashboard and to notification channels. Key features: distributed synthetic monitoring workers, real time WebSocket or SSE updates to a public status page, a full incident lifecycle, investigating, identified, monitoring, resolved, and subscriber notifications through webhooks, email, Discord or Slack. Stack: Go or Node.js for the concurrent worker layer, React with Vite and Tailwind for a light, fast frontend, PostgreSQL or TimescaleDB plus Redis Pub/Sub for the data layer, deployed on Fly.io or Render, exporting metrics in the Prometheus format. Build this and you learn concurrency models, time series storage, real time communication, high availability design, and how to visualise system health so a non engineer can read it at a glance.</p><p class=\"mb-3\">Pick the one that matches the kind of engineer you want to become, tooling and automation, or infrastructure and reliability. Either is a legitimate, hireable specialism, and both routes reach the same bar of production readiness by week 11.</p><p class=\"mb-3\"><strong class=\"font-semibold text-slate-900\">Before you call your capstone done.</strong> Push it to a public GitHub repo, write a LinkedIn post explaining the architecture choice you are proudest of, the webhooks and LLM orchestration, or the concurrency model, and share it on at least one other platform. This is the project a hiring manager reads closest, make sure they can find it.</p>",
      "keyTerms": [
        {
          "term": "HMAC signature validation",
          "planHtml": "checking a cryptographic signature on an incoming webhook to prove it genuinely came from GitHub and was not forged by someone else"
        },
        {
          "term": "WebSocket versus SSE",
          "planHtml": "two ways to push live updates to a browser, WebSocket is two way and always open, SSE is simpler and one way, server to client only"
        },
        {
          "term": "Prometheus metrics format",
          "planHtml": "a plain text, standard way of exposing numbers like latency and uptime so monitoring tools can read them without custom code"
        }
      ],
      "activityHtml": "Before writing any code for whichever project you choose, sketch its full architecture in Mermaid.js, every service, queue, and data store it needs, and check that diagram into the repository's README before the first commit that is not scaffolding. When it is finished, push it to a public GitHub repo, write the LinkedIn post, and share it on one other platform before you call it done."
    },
    {
      "number": 6,
      "title": "Turn the portfolio into a job offer",
      "eyebrow": "Week 12",
      "hookHtml": "Three months of disciplined engineering counts for very little if a recruiter cannot see it in ninety seconds, so the final week is spent making sure your GitHub profile, your LinkedIn and your interview answers all tell the same, true, impressive story.",
      "outcomes": [
        "Rebuild your GitHub profile so a pinned repository sells itself in under a minute",
        "Write a LinkedIn headline and three posts that read as engineering, not as a job search",
        "Explain your architecture choices using the STAR method under real interview pressure",
        "Walk through your own PR history and defend a decision you made weeks ago"
      ],
      "bodyHtml": "<p class=\"mb-3\">The final two weeks convert three completed projects into job offers, which is a different skill from building the projects in the first place, and it deserves its own dedicated attention rather than being squeezed in after the last commit.</p><p class=\"mb-3\">Start with the GitHub profile. Every pinned repository needs a professional README, an architecture diagram, a live demo link hosted on a free tier, Vercel, Render or Supabase, CI/CD badges showing build passing, coverage and security scanned, and clear how to run locally instructions with Docker. Underneath all of that, a clean, consistent green commit graph tells its own story, that you showed up and did the work, day after day, not in one panicked weekend.</p><p class=\"mb-3\">Next, LinkedIn positioning. The headline should say what you actually do, Software Engineer, React, TypeScript, Node.js, Go, DevSecOps and Cloud Native, not a generic Computer Science Graduate. The featured section should embed live project links with an architecture diagram attached. And write three posts that walk through a real technical challenge you solved, for example how you implemented AI moderation in a REST API using webhooks and Node.js, because a post like that is proof of thinking, not just a claim of skill.</p><p class=\"mb-3\">Finally, the interview readiness kit. Practise explaining every project with the STAR method, but aimed specifically at architecture choices, why PostgreSQL over MongoDB, why JWT over session cookies, because that is the question a senior interviewer actually asks. Run two mock interviews, one on data structures and practical problem solving, JSON manipulation, async handling, algorithms, and one on system design and code review, where you walk someone through your own PR history and defend the decisions in it.</p><p class=\"mb-3\">This is the whole point of the twelve weeks. Not three finished projects sitting quietly in a repository, but three finished projects you can stand behind, explain, and defend, in front of someone deciding whether to hire you.</p>",
      "keyTerms": [
        {
          "term": "STAR method",
          "planHtml": "a way of answering an interview question by covering the Situation, Task, Action and Result, kept concrete instead of vague"
        },
        {
          "term": "System design interview",
          "planHtml": "an interview that tests how you architect a system, not whether you can recite a specific algorithm from memory"
        }
      ],
      "activityHtml": "Tonight, rewrite the README of your strongest project so a complete stranger can read it in 60 seconds and know exactly what it does, how to run it, and why you built it the way you did."
    }
  ],
  "tracksIntroHtml": "<h4 class=\"font-bold text-slate-900 mt-5 mb-2\">How to choose your track</h4><p class=\"mb-3\">Before you learn a single tool, get clear on one thing. What kind of work makes you lose track of time. The tech industry is not one job, it is a city of neighbourhoods, and you will do far better living in the one that suits your temperament than chasing the one with the loudest salary.</p><p class=\"mb-3\">Here is a simple way to find your street.</p><ul class=\"list-disc pl-5 my-3 space-y-1\"><li><strong class=\"font-semibold text-slate-900\">You love asking why and telling the story.</strong> You enjoy spreadsheets, patterns, and explaining what the numbers mean to a person who is not technical. Start in the <strong class=\"font-semibold text-slate-900\">Data track</strong>, most likely as a Data Analyst.</li><li><strong class=\"font-semibold text-slate-900\">You love making things look clear and clickable.</strong> You want a manager to open a dashboard and instantly understand the business. That is <strong class=\"font-semibold text-slate-900\">BI</strong>, still in the Data track.</li><li><strong class=\"font-semibold text-slate-900\">You love plumbing and reliability.</strong> You care that data or software arrives on time, every time, even during load shedding. Look at <strong class=\"font-semibold text-slate-900\">Data Engineering</strong> or <strong class=\"font-semibold text-slate-900\">DevOps</strong>.</li><li><strong class=\"font-semibold text-slate-900\">You love designing the whole system on a whiteboard.</strong> You think in boxes and arrows and trade offs. That is the <strong class=\"font-semibold text-slate-900\">Architect</strong> path, in either the Data or the Cloud track.</li><li><strong class=\"font-semibold text-slate-900\">You love building the thing people actually touch.</strong> Apps, websites, features. That is the <strong class=\"font-semibold text-slate-900\">Software track</strong>.</li><li><strong class=\"font-semibold text-slate-900\">You love the maths of prediction and experiments.</strong> You want to forecast churn or detect fraud. That is <strong class=\"font-semibold text-slate-900\">Data Science</strong>, and it opens the door to the <strong class=\"font-semibold text-slate-900\">AI track</strong>.</li><li><strong class=\"font-semibold text-slate-900\">You love protecting things and thinking like an attacker.</strong> That is the <strong class=\"font-semibold text-slate-900\">Security track</strong>.</li></ul><p class=\"mb-3\">A few honest truths for a South African beginner. You do not need a degree to start, you need proof that you can do the work, which means projects on GitHub and one or two starter certifications. Salaries in this guide come from the OfferZen 2026 Developer Salary and Benefits Report and PayScale South Africa, verified July 2026, and they move fast, so always check the live source before you quote a number to anyone. Entry level developer pay in Cape Town averaged around R23 846 per month in early 2026 per OfferZen, and it climbs steeply with skill and with remote work for overseas companies. Pick the track you enjoy, because the one you enjoy is the one you will practise long enough to get paid well for.</p><p class=\"mb-3\">Sources, verified July 2026: <a href=\"https://www.offerzen.com/resources/developer-salary-benefits-report\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-indigo-600 underline hover:text-indigo-800\">OfferZen Developer Salary and Benefits Report 2026</a>, <a href=\"https://www.offerzen.com/blog/software-developer-salary-south-africa\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-indigo-600 underline hover:text-indigo-800\">OfferZen software developer salary</a>, <a href=\"https://www.payscale.com/research/ZA/Job=Data_Engineer/Salary\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-indigo-600 underline hover:text-indigo-800\">PayScale South Africa Data Engineer</a>, <a href=\"https://admissions.explore.ai/home\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-indigo-600 underline hover:text-indigo-800\">ExploreAI Academy</a>, <a href=\"https://learn.microsoft.com/en-us/credentials/certifications/\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-indigo-600 underline hover:text-indigo-800\">Microsoft Learn certifications</a>, <a href=\"https://aws.amazon.com/certification/\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-indigo-600 underline hover:text-indigo-800\">AWS certification</a>.</p>",
  "tracks": [
    {
      "name": "Data track",
      "summaryHtml": "The most beginner friendly on-ramp in tech. It runs from answering questions with data, to building the dashboards, to laying the pipes, to designing the platform, to predicting the future. If you like patterns, business, and explaining things clearly, start here.",
      "roles": [
        {
          "title": "Data Analyst",
          "whatHtml": "A Data Analyst answers business questions using data. Someone asks why did sales drop in the Western Cape last month, and the analyst pulls the numbers, cleans them, finds the pattern, and explains it in plain language with a chart or a short report. Think of the analyst as a detective who works with a spreadsheet and a database instead of a magnifying glass.",
          "differsHtml": "The analyst answers questions and reports on what already happened. A BI Developer builds the reusable dashboards and data models the analyst and the whole company then use. A Data Scientist goes further and predicts what will happen next. The analyst mostly looks backward and explains, the scientist looks forward and forecasts.",
          "coreSkills": [
            "Excel or Google Sheets to a strong level",
            "SQL for pulling and joining data, this is the non negotiable core skill",
            "Power BI or Tableau for charts and dashboards",
            "Basic statistics, averages, percentages, correlation",
            "Clear communication and storytelling with data",
            "A little Python or the willingness to learn it"
          ],
          "starterCerts": [
            "Microsoft DP-900 Azure Data Fundamentals, the classic first cert, fundamentals never expire per Microsoft Learn",
            "Google Data Analytics Certificate on Coursera",
            "Microsoft PL-300 Power BI Data Analyst once you are comfortable"
          ],
          "entryHtml": "This is the easiest tech job to break into with no degree. Learn SQL and Power BI for free, then build three small projects on public South African data, load shedding stats from Eskom, crime stats, or Takealot style sales you invent, and put them on a GitHub or a simple portfolio site. Pass DP-900, it is affordable and quick to study in two to four weeks. Then apply for junior analyst and data captured roles, look on OfferZen, LinkedIn, and Pnet. The ExploreAI Academy in Cape Town trains exactly this pipeline and lists Data Analyst as a first job title on their programme."
        },
        {
          "title": "BI Analyst or BI Developer",
          "whatHtml": "A Business Intelligence Developer builds the dashboards and the semantic model that sits under them. Where the analyst answers one question, the BI Developer builds a self service tool so the whole company can answer that kind of question themselves. They design the data model, write the calculations once so everyone uses the same definition of revenue, and make dashboards that a busy manager understands in five seconds.",
          "differsHtml": "A Data Analyst uses dashboards and answers ad hoc questions. The BI Developer builds and maintains the dashboards and the model behind them, so it is a step more technical and more permanent. A Data Engineer feeds clean data into the BI layer, the BI Developer shapes that data into a business friendly model. Analyst consumes, BI builds the reporting layer, engineer builds the pipeline underneath.",
          "coreSkills": [
            "Advanced Power BI, including DAX, the calculation language",
            "Strong SQL and data modelling, star schemas, fact and dimension tables",
            "Semantic modelling, defining measures once for everyone",
            "Dashboard and visual design, clarity over decoration",
            "Understanding the business so the metrics mean something"
          ],
          "starterCerts": [
            "Microsoft PL-300 Power BI Data Analyst, the core BI cert",
            "Microsoft DP-600 Fabric Analytics Engineer, the modern Microsoft analytics engineering cert, which centres on semantic models, Power BI and DAX per Microsoft Learn July 2026",
            "Tableau Desktop Specialist if your employer uses Tableau"
          ],
          "entryHtml": "Start as a Data Analyst, then go deep on Power BI and DAX, because DAX is where most people stall and it is your differentiator. Rebuild your analyst portfolio projects as proper models with reusable measures, not just one off charts. Many South African firms run on Power BI because it comes bundled with the Microsoft 365 they already pay for, so PL-300 is genuinely in demand. Pass PL-300, then apply for BI Developer and Reporting Analyst roles, which pay noticeably more than pure analyst roles."
        },
        {
          "title": "Data Engineer",
          "whatHtml": "A Data Engineer builds the pipelines that move and shape data. Every night, or every few minutes, data has to travel from apps, tills, and websites into a place where analysts and scientists can use it, cleaned and organised. The engineer builds and runs that plumbing so it is reliable, fast, and does not break at month end. If the analyst is the chef, the engineer stocks the kitchen and keeps the water running.",
          "differsHtml": "Analysts and BI Developers consume the data the engineer prepares. The Data Engineer rarely makes the charts, they make sure the data is there, clean, and on time. A Data Architect designs the blueprint of the whole platform, the engineer builds and operates the pieces. The line is design versus build and run, though at small companies one person does both.",
          "coreSkills": [
            "Advanced SQL and Python",
            "Building data pipelines, ETL and ELT",
            "A cloud platform, Azure, AWS or Google Cloud",
            "Tools like Spark, Airflow, dbt, and increasingly Microsoft Fabric",
            "Data warehousing and data lakes",
            "Reliability thinking, testing, monitoring, handling failures"
          ],
          "starterCerts": [
            "Microsoft DP-900 to start, then Microsoft DP-700 Fabric Data Engineer Associate, which replaced the retired DP-203 in 2025 and is the current data engineering exam at 165 US dollars per Microsoft Learn July 2026",
            "AWS Certified Data Engineer Associate at 150 US dollars if your target employer runs on AWS",
            "dbt Analytics Engineering certification as a bonus"
          ],
          "entryHtml": "This role usually is not a first job, it is a strong second step. Come in as a Data Analyst or a junior software developer, learn Python and cloud properly, then move across. Build a real pipeline project, pull data from a public API on a schedule, clean it, load it into a cloud warehouse, and show the code on GitHub. Pass DP-700, which is the certification path Brendon himself walked. Data Engineer is well paid, PayScale South Africa put the average near R460 000 per year in 2026, so the effort pays back."
        },
        {
          "title": "Data Architect",
          "whatHtml": "A Data Architect designs the whole data platform. Before anyone builds a pipeline or a dashboard, the architect decides where data lives, how it flows, which tools connect to which, how it stays secure and POPIA compliant, and how it will still work when the company is ten times bigger. They draw the master plan and set the standards everyone else follows. This is the town planner of the data city.",
          "differsHtml": "A Data Engineer builds and runs pipelines inside the plan. The architect draws the plan and picks the tools and the rules. Where an engineer thinks about this pipeline, the architect thinks about every pipeline for the next five years, plus cost, security, and governance. It is the most senior and most strategic seat in the Data track.",
          "coreSkills": [
            "Deep experience across databases, warehouses, and lakes",
            "Cloud platform architecture, Azure or AWS to an expert level",
            "Data governance, security, and POPIA compliance",
            "Cost management, cloud bills get large fast",
            "Systems thinking and clear diagramming",
            "Stakeholder communication, translating business needs into a technical blueprint"
          ],
          "starterCerts": [
            "Microsoft DP-700 plus AZ-305 Azure Solutions Architect Expert for the platform view",
            "AWS Certified Solutions Architect Professional if you are on AWS",
            "These come after years of hands on work, an architect is not an entry role"
          ],
          "entryHtml": "There is no beginner path here, and be wary of anyone selling you one. You reach architect after several years as a strong Data Engineer or Solutions Architect, once you have felt the pain of systems that were designed badly and learned what good looks like. For a beginner the honest advice is aim here as a five to eight year goal, and start by becoming an excellent Data Engineer first."
        },
        {
          "title": "Data Scientist",
          "whatHtml": "A Data Scientist builds predictive and machine learning models. Instead of only explaining the past, they use maths and code to forecast the future or find hidden patterns, which customers are likely to leave, is this transaction fraud, what should we recommend next. They run experiments, test hypotheses, and turn messy data into a model that makes a decision or a prediction.",
          "differsHtml": "A Data Analyst explains what happened, the Data Scientist predicts what will happen and often quantifies the uncertainty. A Machine Learning Engineer takes the scientist's model and turns it into a reliable production system that serves millions of requests. So the scientist leans toward maths, statistics, and experimentation, the ML engineer leans toward software engineering and deployment. Many jobs blur these two.",
          "coreSkills": [
            "Strong Python, including pandas, scikit-learn",
            "Solid statistics and probability, this is the real backbone",
            "Machine learning fundamentals, regression, classification, clustering",
            "SQL and data wrangling",
            "Communicating model results to non technical people",
            "Increasingly, some familiarity with large language models"
          ],
          "starterCerts": [
            "A recognised bootcamp or academy certificate carries more weight here than a single exam, the ExploreAI Academy Data Science programme is the well known South African route",
            "Microsoft DP-100 Azure Data Scientist Associate",
            "AWS Certified Machine Learning Associate as you mature"
          ],
          "entryHtml": "The maths bar is real, so this is harder to enter cold than analysis. Two honest routes for a South African beginner. First, a structured programme like ExploreAI Academy in Cape Town, which teaches Python, statistics, and machine learning in a project based way and lists Data Scientist as an outcome, and which offers bursaries up to R70 000 for citizens. Second, self study the maths and Python, then win a couple of Kaggle competitions and publish the notebooks. Either way, expect twelve to eighteen months of serious study. Many people wisely start as an analyst, earn while they learn the maths, then cross over."
        }
      ]
    },
    {
      "name": "Cloud and Infrastructure track",
      "summaryHtml": "The people who run the digital land the software lives on. If you like reliability, automation, and the satisfaction of a system that just works and scales, this track pays very well and is in heavy demand, because every company is moving to the cloud.",
      "roles": [
        {
          "title": "Cloud Architect or Solutions Architect",
          "whatHtml": "A Cloud or Solutions Architect designs how an application will run in the cloud. Given a business need, a booking app that must handle a rush without falling over, they decide which cloud services to use, how the pieces connect, how it stays secure and affordable, and how it survives a data centre problem. They produce the technical blueprint that the developers and DevOps engineers then build.",
          "differsHtml": "A DevOps Engineer automates and operates the systems day to day, the architect designs them up front. A Data Architect focuses specifically on data platforms, the Solutions Architect covers the whole application, compute, networking, storage, and security. Architect is a design and decision role, DevOps is a build and run role, and at small firms one person wears both hats.",
          "coreSkills": [
            "Deep knowledge of one cloud, AWS, Azure, or Google Cloud",
            "Networking, security, and identity fundamentals",
            "Cost optimisation, the cloud bill is a real business concern",
            "Systems design and clear diagramming",
            "Understanding trade offs, faster versus cheaper versus more reliable",
            "Communicating with both business and technical people"
          ],
          "starterCerts": [
            "Cloud fundamentals first, AWS Certified Cloud Practitioner at 100 US dollars, or Microsoft AZ-900, both foundational per AWS and Microsoft Learn July 2026",
            "Then AWS Certified Solutions Architect Associate at 150 US dollars, the flagship associate cert",
            "Or Microsoft AZ-104 Administrator then AZ-305 Solutions Architect Expert"
          ],
          "entryHtml": "You do not start as an architect, you grow into it. But the cloud track has a friendly first rung, the fundamentals cert. A beginner can pass AZ-900 or AWS Cloud Practitioner in a month, which opens junior cloud support and cloud administrator roles. From there, get the AWS Solutions Architect Associate, gain two or three years of hands on experience, and the architect title follows. Cloud skills add a real premium, OfferZen 2026 noted that AWS, Azure, or Kubernetes certifications often lift pay by ten to twenty percent."
        },
        {
          "title": "DevOps Engineer",
          "whatHtml": "A DevOps Engineer automates the path from a developer's laptop to live users, and keeps the whole thing running. They build the pipelines that test and ship code automatically, manage the servers as code so nothing is set up by hand, monitor for problems, and get the team back up fast when something breaks. The name joins Development and Operations, because the job is to make those two work as one smooth machine.",
          "differsHtml": "A Software Developer writes the application, the DevOps Engineer builds the machinery that ships and runs it reliably. A Cloud Architect designs the system, the DevOps Engineer automates and operates it. Think designer versus mechanic and pit crew. In South Africa, where load shedding and connectivity make reliability a daily fight, good DevOps people are prized.",
          "coreSkills": [
            "Linux and strong command line comfort",
            "Scripting, Bash and Python",
            "CI/CD tools, GitHub Actions, GitLab CI, Jenkins",
            "Containers and orchestration, Docker and Kubernetes",
            "Infrastructure as code, Terraform",
            "A cloud platform and monitoring tools"
          ],
          "starterCerts": [
            "Cloud fundamentals first, AZ-900 or AWS Cloud Practitioner",
            "HashiCorp Terraform Associate, the industry standard for infrastructure as code",
            "AWS Certified DevOps Engineer Professional, or Microsoft AZ-400 DevOps Engineer Expert, as you mature",
            "Certified Kubernetes Administrator, CKA, once you are working with Kubernetes"
          ],
          "entryHtml": "Two common doors. Either come from software development and drift toward automation and infrastructure, or come from IT support and system administration and learn to code your infrastructure. For a beginner, learn Linux and Git deeply, automate something real, a small app that deploys itself when you push code, and show it on GitHub. Get a fundamentals cert then the Terraform Associate. DevOps sits among the best paid entry points, OfferZen 2026 found entry level DevOps engineers earning meaningfully more than backend developers."
        }
      ]
    },
    {
      "name": "Software track",
      "summaryHtml": "The builders. If you like making things that people use, apps, websites, and features, and you enjoy the loop of write it, run it, fix it, this is the broadest and most flexible track in tech, and the most forgiving of a non traditional background.",
      "roles": [
        {
          "title": "Software Developer or Software Engineer",
          "whatHtml": "A Software Developer writes the code that becomes the apps, websites, and systems people use every day. They turn an idea, let users book a doctor online, into working software, then test it, fix the bugs, and improve it. The two titles overlap heavily. In practice, developer often points at writing features, while engineer suggests a broader concern with how the whole system is designed, tested, and scaled, though many companies use the words interchangeably.",
          "differsHtml": "A DevOps Engineer ships and runs what the developer writes. A Data Engineer moves data rather than building user facing features. A Machine Learning Engineer is a software engineer who specialises in getting models into production. The plain Software Developer builds the product the customer actually clicks on, which makes it the most visible and often the first coding job people land.",
          "coreSkills": [
            "A programming language done well, JavaScript, Python, C#, or Java",
            "Web fundamentals, HTML, CSS, and a framework like React",
            "Git and version control",
            "Databases and SQL basics",
            "Problem solving and reading other people's code",
            "Testing and debugging"
          ],
          "starterCerts": [
            "Certifications matter less here than a portfolio, this track hires on proof of work",
            "Optional, Microsoft AZ-900 or a freeCodeCamp certification to show foundations",
            "Meta Front End or Back End Developer Certificate on Coursera as structured proof"
          ],
          "entryHtml": "This is the classic no degree success story. Pick one path, front end web is the gentlest start, learn it properly, and build real projects that solve real problems, a site for a local spaza shop, a booking tool, a small SaaS. Your GitHub and a live portfolio are your degree here. In South Africa, WeThinkCode teaches software development for free and hires without requiring matric maths in the usual way, and OfferZen is built to match self taught developers with employers. Entry level developer pay in Cape Town averaged about R23 846 a month in early 2026 per OfferZen, and remote work for overseas companies can multiply that."
        }
      ]
    },
    {
      "name": "Security track",
      "summaryHtml": "The protectors. As every business moves online and POPIA makes data protection the law, the people who defend systems are in short supply and high demand. If you like puzzles, thinking like an attacker, and being the calm one in a crisis, this is your track.",
      "roles": [
        {
          "title": "Cybersecurity Analyst or Security Engineer",
          "whatHtml": "A Cybersecurity Analyst watches over an organisation's systems and defends them from attack. They monitor for suspicious activity, investigate alerts, patch weaknesses before criminals find them, and respond when something goes wrong, a phishing attack, a ransomware attempt, a leaked password. A Security Engineer goes further and builds the defences themselves, secure networks, firewalls, and identity systems, rather than only watching them.",
          "differsHtml": "The analyst mostly monitors, investigates, and responds, the closest thing to a digital security guard and detective. The engineer designs and builds the protective systems, more like the architect of the fortress. Both differ from a DevOps Engineer, who keeps systems running, while security people keep them safe. In small South African firms one person often covers both analyst and engineer duties.",
          "coreSkills": [
            "Networking fundamentals, how data actually moves",
            "Operating systems, especially Linux and Windows internals",
            "Security concepts, threats, encryption, identity and access",
            "Reading logs and using monitoring tools, a SIEM",
            "Basic scripting, Python",
            "A calm, methodical, curious mindset and awareness of POPIA obligations"
          ],
          "starterCerts": [
            "CompTIA Security+ SY0-701, the global entry standard for security, priced around 425 US dollars per exam cost trackers July 2026",
            "Microsoft SC-900 Security, Compliance and Identity Fundamentals, an affordable and beginner friendly start, and it never expires",
            "CompTIA A+ and Network+ first if you are completely new to IT",
            "Certified Ethical Hacker, CEH, later if you lean toward offensive security"
          ],
          "entryHtml": "Most people do not start in security, they arrive after a year or two in IT support or networking, because you must understand how systems work before you can defend them. A realistic South African path, get CompTIA A+ then Network+ to land an IT support job, learn on the job, then add SC-900 and Security+ and move into a junior security or SOC analyst role. Practise on free platforms like TryHackMe and Hack The Box and show your progress. Note that Microsoft AZ-500 retires on 30 September 2026 and is replaced by SC-500, which adds AI system security, so aim at the current exam."
        }
      ]
    },
    {
      "name": "AI track",
      "summaryHtml": "The newest and fastest moving neighbourhood, and where Brendon himself lives. It grows straight out of the Data and Software tracks. If you are excited by machine learning and by the wave of large language models, this is where data science, software engineering, and product thinking meet.",
      "roles": [
        {
          "title": "Machine Learning Engineer",
          "whatHtml": "A Machine Learning Engineer takes models and makes them work in the real world at scale. Where a Data Scientist might prove that a model can predict fraud in a notebook, the ML Engineer turns that into a reliable service that scores millions of live transactions, fast, cheaply, and without falling over. They are software engineers who specialise in the messy business of getting models into production and keeping them healthy.",
          "differsHtml": "A Data Scientist explores data and builds the model, the ML Engineer productionises and scales it, so the scientist leans maths and the engineer leans software and systems. A Data Engineer moves data in general, the ML Engineer builds the specific pipelines that feed and serve models. An AI Engineer, in today's usage, often works more with ready made large language models than with training models from scratch. The lines are genuinely blurry and titles vary by company.",
          "coreSkills": [
            "Strong software engineering in Python",
            "Machine learning frameworks, scikit-learn, PyTorch or TensorFlow",
            "MLOps, deploying, monitoring, and retraining models",
            "Cloud and containers, Docker, Kubernetes",
            "Data pipelines and APIs",
            "Solid maths and statistics underneath it all"
          ],
          "starterCerts": [
            "AWS Certified Machine Learning Engineer Associate at 150 US dollars, or Microsoft AI-102 Azure AI Engineer",
            "Microsoft DP-100 Azure Data Scientist Associate for the modelling side",
            "A cloud fundamentals cert first if you are new to cloud"
          ],
          "entryHtml": "This is a second or third role, not a first job. You arrive from software engineering or from data science, then add the missing half. A software developer learns the machine learning maths, or a data scientist learns to write production grade code and deploy. For a beginner the honest sequence is, become a solid Software Developer or Data Scientist first, then specialise. It is one of the best paid roles in tech, which reflects how much ground you must cover to get there."
        },
        {
          "title": "AI Engineer",
          "whatHtml": "An AI Engineer builds products and features on top of existing AI models, especially large language models like Claude and GPT. Rather than training a model from zero, they wire powerful ready made models into real applications, a chatbot that knows your company's policies, a tool that reads contracts and flags risks, an assistant that drafts emails. They combine software engineering with techniques like retrieval augmented generation, prompting, and agent design. This is exactly the work Brendon does as a senior AI engineer.",
          "differsHtml": "A Machine Learning Engineer often trains and optimises models, the AI Engineer more often composes and orchestrates existing ones into products, though the roles overlap and are converging. A Software Developer builds general apps, the AI Engineer builds apps whose core intelligence comes from an AI model, which brings new problems, prompts, context, cost per call, and unpredictable outputs. A Prompt Engineer focuses narrowly on crafting the instructions, the AI Engineer builds the whole system around them.",
          "coreSkills": [
            "Strong software engineering, usually Python or JavaScript",
            "Working with LLM APIs and orchestration tools",
            "Retrieval augmented generation and vector databases",
            "Prompt design and evaluation",
            "Understanding model limits, cost, and safety",
            "Product sense, knowing what is worth building"
          ],
          "starterCerts": [
            "This field is so new that projects beat certificates, build and ship something real with an AI API",
            "Microsoft AI-900 AI Fundamentals as a gentle start, then AI-102 Azure AI Engineer",
            "Vendor and course certificates on RAG and LLM applications as structured proof"
          ],
          "entryHtml": "The fastest growing door in tech, and unusually open, because almost nobody has ten years of experience in a field this young. If you can already code, you can start today, build a small but genuinely useful AI app, a study assistant, a tool for a local business, and ship it. Brendon's own leap, data analyst to data engineer to senior AI engineer in under six months, shows how fast this track can move for someone who builds relentlessly. Learn one LLM API well, master retrieval augmented generation, and put working projects in front of employers. Proof of building beats any certificate here."
        },
        {
          "title": "Prompt Engineer",
          "whatHtml": "A Prompt Engineer designs the instructions that get the best, safest, most reliable results out of an AI model. They craft and test the wording, structure, and examples that steer a model, measure which versions work better, and build reusable prompt templates and guardrails for a product. In practice this is rarely a standalone job title anymore, it has become a core skill folded into the AI Engineer, content, and product roles.",
          "differsHtml": "An AI Engineer builds the whole application, including the code, data, and infrastructure, and uses prompting as one tool among many. A pure Prompt Engineer focuses only on the language that goes into the model. Because prompting alone is a thin foundation for a career, treat it as a high value skill to master rather than a destination. It pairs beautifully with the Software, AI, and even content and marketing tracks.",
          "coreSkills": [
            "Clear, precise writing and logical thinking",
            "Deep, hands on understanding of how LLMs behave",
            "Systematic testing and evaluation of prompts",
            "Some coding to automate and measure, Python helps",
            "Domain knowledge in whatever field you apply it to",
            "Awareness of safety, bias, and where models go wrong"
          ],
          "starterCerts": [
            "No meaningful formal certification defines this yet, a portfolio of documented prompt work speaks loudest",
            "Anthropic and other vendor prompt engineering courses and guides",
            "Pair it with AI-900 to show broader AI literacy"
          ],
          "entryHtml": "The most accessible entry point into AI for a non coder, and the best advice is do not stop here. Use free access to models like Claude to practise daily, document your before and after results, and solve a real problem for a real person or business. Then add either light coding to grow toward AI Engineer, or domain depth to become the AI savvy expert in law, marketing, or education. On its own, prompt engineering is a strong skill and a weak career, so use it as a springboard into the wider AI track."
        }
      ]
    }
  ],
  "salaries": [
    {
      "role": "Data Analyst",
      "track": "Data",
      "intern": "R6,000 to R12,000",
      "junior": "R15,000 to R25,000",
      "mid": "R25,000 to R40,000",
      "senior": "R45,000 to R70,000",
      "lead": "R55,000 to R75,000"
    },
    {
      "role": "Business Intelligence (BI) Analyst / Developer",
      "track": "Data",
      "intern": "n/a",
      "junior": "R18,000 to R28,000",
      "mid": "R28,000 to R45,000",
      "senior": "R45,000 to R65,000",
      "lead": "R60,000 to R85,000"
    },
    {
      "role": "Data Engineer",
      "track": "Data",
      "intern": "R12,000 to R20,000",
      "junior": "R25,000 to R40,000",
      "mid": "R40,000 to R60,000",
      "senior": "R65,000 to R90,000",
      "lead": "R85,000 to R120,000"
    },
    {
      "role": "Data Architect",
      "track": "Data",
      "intern": "n/a",
      "junior": "R40,000 to R55,000",
      "mid": "R55,000 to R75,000",
      "senior": "R75,000 to R100,000",
      "lead": "R95,000 to R130,000"
    },
    {
      "role": "Data Scientist",
      "track": "Data",
      "intern": "R10,000 to R18,000",
      "junior": "R25,000 to R40,000",
      "mid": "R40,000 to R60,000",
      "senior": "R60,000 to R85,000",
      "lead": "R80,000 to R120,000"
    },
    {
      "role": "Machine Learning Engineer",
      "track": "AI/ML",
      "intern": "R12,000 to R20,000",
      "junior": "R30,000 to R45,000",
      "mid": "R45,000 to R65,000",
      "senior": "R65,000 to R95,000",
      "lead": "R90,000 to R130,000"
    },
    {
      "role": "AI Engineer",
      "track": "AI/ML",
      "intern": "R15,000 to R22,000",
      "junior": "R35,000 to R50,000",
      "mid": "R50,000 to R75,000",
      "senior": "R75,000 to R110,000",
      "lead": "R100,000 to R150,000"
    },
    {
      "role": "Prompt Engineer",
      "track": "Emerging",
      "intern": "n/a",
      "junior": "R30,000 to R45,000",
      "mid": "R45,000 to R65,000",
      "senior": "R65,000 to R90,000",
      "lead": "R85,000 to R110,000"
    },
    {
      "role": "Software Developer / Engineer",
      "track": "Software",
      "intern": "R8,000 to R18,000",
      "junior": "R23,000 to R40,000",
      "mid": "R40,000 to R65,000",
      "senior": "R65,000 to R95,000",
      "lead": "R90,000 to R130,000"
    },
    {
      "role": "Cloud / Solutions Architect",
      "track": "Cloud/Infra",
      "intern": "n/a",
      "junior": "R40,000 to R55,000",
      "mid": "R55,000 to R80,000",
      "senior": "R80,000 to R115,000",
      "lead": "R110,000 to R150,000"
    },
    {
      "role": "Cybersecurity Analyst / Engineer",
      "track": "Security",
      "intern": "R10,000 to R16,000",
      "junior": "R22,000 to R35,000",
      "mid": "R35,000 to R55,000",
      "senior": "R55,000 to R85,000",
      "lead": "R80,000 to R120,000"
    },
    {
      "role": "DevOps Engineer",
      "track": "Cloud/Infra",
      "intern": "R12,000 to R20,000",
      "junior": "R38,000 to R55,000",
      "mid": "R55,000 to R85,000",
      "senior": "R80,000 to R110,000",
      "lead": "R95,000 to R120,000"
    }
  ],
  "certs": [
    {
      "provider": "Anthropic",
      "items": [
        {
          "name": "Anthropic Academy (Build with Claude)",
          "cost": "free, verified July 2026 (email sign up, official Anthropic certificate on completion)",
          "url": "https://anthropic.skilljar.com/",
          "whyHtml": "You learn to build real AI apps and agents with Claude and get an Anthropic branded certificate, which is exactly the hands on evidence local AI roles and studios want to see."
        },
        {
          "name": "AI Fluency and Learn hub",
          "cost": "free, verified July 2026",
          "url": "https://www.anthropic.com/learn",
          "whyHtml": "A no code entry point that lets a total beginner speak the language of AI in a weekend, useful for any office job that now touches AI."
        }
      ]
    },
    {
      "provider": "OpenAI",
      "items": [
        {
          "name": "OpenAI Academy (AI Foundations, Applied AI, Agents and Workflows)",
          "cost": "free, verified July 2026 (needs a ChatGPT account, gives a certificate of completion)",
          "url": "https://academy.openai.com/",
          "whyHtml": "Free, practical AI at work training that shows an employer you can turn ChatGPT into real workflows, strong for admin, marketing and ops roles."
        }
      ]
    },
    {
      "provider": "Microsoft",
      "items": [
        {
          "name": "Microsoft Learn training platform",
          "cost": "free, verified July 2026 (only the exams cost money)",
          "url": "https://learn.microsoft.com/en-us/training/",
          "whyHtml": "All the official study material is free, so you only pay when you sit the exam, which keeps a full learning path within a student budget."
        },
        {
          "name": "AZ-900 Azure Fundamentals",
          "cost": "exam about 99 USD, roughly R1 850, verified July 2026",
          "url": "https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/",
          "whyHtml": "The cheapest respected cloud badge, it proves you understand the cloud and is the standard first line on a Cape Town cloud or support CV."
        },
        {
          "name": "AI-900 Azure AI Fundamentals",
          "cost": "exam about 99 USD, roughly R1 850, verified July 2026",
          "url": "https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-fundamentals/",
          "whyHtml": "A low cost way to show you grasp AI and machine learning basics, a quick credibility boost for anyone pivoting into AI work."
        },
        {
          "name": "DP-900 Azure Data Fundamentals",
          "cost": "exam about 99 USD, roughly R1 850, verified July 2026",
          "url": "https://learn.microsoft.com/en-us/credentials/certifications/azure-data-fundamentals/",
          "whyHtml": "Entry ticket into data roles, it signals you know relational and non relational data on Azure before you touch a harder data cert."
        },
        {
          "name": "DP-700 Fabric Data Engineer Associate",
          "cost": "exam about 165 USD, roughly R3 050, verified July 2026",
          "url": "https://learn.microsoft.com/en-us/credentials/certifications/fabric-data-engineer-associate/",
          "whyHtml": "A current, in demand data engineering credential on Microsoft Fabric that maps straight to real data engineer job openings on OfferZen."
        },
        {
          "name": "AZ-104 Azure Administrator Associate",
          "cost": "exam about 165 USD, roughly R3 050, verified July 2026",
          "url": "https://learn.microsoft.com/en-us/credentials/certifications/azure-administrator/",
          "whyHtml": "The workhorse cloud admin cert, employers hiring for cloud operations and support roles list it by name."
        },
        {
          "name": "SC-900 Security, Compliance and Identity Fundamentals",
          "cost": "exam about 99 USD, roughly R1 850, verified July 2026",
          "url": "https://learn.microsoft.com/en-us/credentials/certifications/security-compliance-and-identity-fundamentals/",
          "whyHtml": "Security is a hiring magnet and this cheap fundamentals badge opens the door to cybersecurity and compliance adjacent roles, which pair well with POPIA work."
        },
        {
          "name": "PL-300 Power BI Data Analyst Associate",
          "cost": "exam about 165 USD, roughly R3 050, verified July 2026",
          "url": "https://learn.microsoft.com/en-us/credentials/certifications/data-analyst-associate/",
          "whyHtml": "Power BI is the tool most South African companies use for reporting, so this cert turns spreadsheet skills into a hireable data analyst title."
        }
      ]
    },
    {
      "provider": "AWS",
      "items": [
        {
          "name": "AWS Certified Cloud Practitioner (CLF-C02)",
          "cost": "exam about 100 USD, roughly R1 850, verified July 2026 (free study on AWS Skill Builder)",
          "url": "https://aws.amazon.com/certification/certified-cloud-practitioner/",
          "whyHtml": "The most recognised entry cloud cert worldwide, a strong first credential for anyone chasing a cloud or DevOps foot in the door."
        },
        {
          "name": "AWS Certified AI Practitioner (AIF-C01)",
          "cost": "exam about 100 USD, roughly R1 850, verified July 2026",
          "url": "https://aws.amazon.com/certification/certified-ai-practitioner/",
          "whyHtml": "A brand new, affordable AI badge from AWS that signals you understand generative AI on the biggest cloud, timely for AI focused roles."
        },
        {
          "name": "AWS Certified Solutions Architect Associate (SAA-C03)",
          "cost": "exam about 150 USD, roughly R2 800, verified July 2026 (50 percent retake or next exam voucher once certified)",
          "url": "https://aws.amazon.com/certification/certified-solutions-architect-associate/",
          "whyHtml": "Consistently one of the highest paying and most requested certs, it is the credential that lifts you from junior to properly employable cloud engineer."
        },
        {
          "name": "AWS Certified Machine Learning Engineer Associate (MLA-C01)",
          "cost": "exam about 150 USD, roughly R2 800, verified July 2026",
          "url": "https://aws.amazon.com/certification/certified-machine-learning-engineer-associate/",
          "whyHtml": "The current AWS machine learning cert (it replaced the old ML Specialty), proving you can build and deploy ML models on AWS, a direct match for AI engineer roles."
        }
      ]
    },
    {
      "provider": "Google Cloud",
      "items": [
        {
          "name": "Cloud Digital Leader",
          "cost": "exam about 99 USD, roughly R1 850, verified July 2026",
          "url": "https://cloud.google.com/learn/certification/cloud-digital-leader",
          "whyHtml": "An easy, cheap way to prove cloud and AI literacy on Google Cloud, good for sales, project and junior technical roles."
        },
        {
          "name": "Associate Cloud Engineer",
          "cost": "exam about 125 USD, roughly R2 300, verified July 2026",
          "url": "https://cloud.google.com/learn/certification/cloud-engineer",
          "whyHtml": "The hands on Google Cloud engineer badge, it shows you can deploy and manage real workloads and widens your options beyond Azure and AWS."
        },
        {
          "name": "Professional Machine Learning Engineer",
          "cost": "exam about 200 USD, roughly R3 700, verified July 2026",
          "url": "https://cloud.google.com/learn/certification/machine-learning-engineer",
          "whyHtml": "One of the fastest growing and best paid certs in 2026, it marks you as someone who can put ML into production, a senior AI engineering signal."
        }
      ]
    },
    {
      "provider": "Google (Coursera)",
      "items": [
        {
          "name": "Google Data Analytics Professional Certificate",
          "cost": "about 49 USD per month, roughly R900, so about R2 700 over three months, and free with Coursera financial aid, verified July 2026",
          "url": "https://www.coursera.org/professional-certificates/google-data-analytics",
          "whyHtml": "A beginner friendly, job ready analytics path you can do for free via Coursera financial aid, the classic no degree route into a first data job."
        }
      ]
    },
    {
      "provider": "Snowflake",
      "items": [
        {
          "name": "SnowPro Core Certification",
          "cost": "exam about 175 USD, roughly R3 250, verified July 2026 (valid two years)",
          "url": "https://www.snowflake.com/en/data-cloud/certifications/",
          "whyHtml": "Snowflake skills are scarce and well paid, so this core cert stands out on a data engineer CV where few local candidates have it."
        }
      ]
    },
    {
      "provider": "Databricks",
      "items": [
        {
          "name": "Databricks Certified Data Engineer Associate",
          "cost": "exam about 200 USD, roughly R3 700, verified July 2026 (valid two years)",
          "url": "https://www.databricks.com/learn/certification/data-engineer-associate",
          "whyHtml": "Databricks is a top data platform, and this associate cert proves lakehouse and Spark skills that command strong data engineer salaries."
        },
        {
          "name": "Generative AI Fundamentals (with badge)",
          "cost": "free on demand training, earns a shareable badge, verified July 2026",
          "url": "https://www.databricks.com/training/catalog/generative-ai-fundamentals-1765",
          "whyHtml": "A free, short course that ends in a LinkedIn badge, an easy win to show you understand generative AI without spending a cent."
        }
      ]
    },
    {
      "provider": "ExploreAI Academy",
      "items": [
        {
          "name": "Data Science and Data Engineering programmes",
          "cost": "paid, with company sponsored scholarships for South African citizens and flexible monthly or 36 month payment plans, verified July 2026",
          "url": "https://admissions.explore.ai/home",
          "whyHtml": "A proven South African pipeline into data careers, its project based training and scholarships have launched many local data professionals, Brendon studied here himself."
        }
      ]
    },
    {
      "provider": "freeCodeCamp",
      "items": [
        {
          "name": "freeCodeCamp certifications (Responsive Web Design, JavaScript, Data Analysis with Python, Machine Learning)",
          "cost": "free, verified July 2026",
          "url": "https://www.freecodecamp.org/learn",
          "whyHtml": "Completely free, hands on certifications with real coding projects, the cheapest honest way to build a portfolio that gets junior developers hired."
        }
      ]
    },
    {
      "provider": "DataCamp",
      "items": [
        {
          "name": "DataCamp (Data and AI tracks, free student access via GitHub)",
          "cost": "Basic tier free, Premium about 14 USD per month annually, and 3 months free for students through GitHub Education, verified July 2026",
          "url": "https://www.datacamp.com/",
          "whyHtml": "Bite sized, browser based lessons with a free student route through GitHub, ideal for building data and Python skills around a busy schedule."
        }
      ]
    },
    {
      "provider": "Coursera",
      "items": [
        {
          "name": "Coursera courses and certificates with financial aid",
          "cost": "free through financial aid on almost every certificate, usually approved within a few weeks, verified July 2026",
          "url": "https://www.coursera.org/",
          "whyHtml": "Financial aid lets a South African learner earn Google, IBM, UCT and Wits certificates for free, removing cost as a barrier to a credential employers recognise."
        }
      ]
    },
    {
      "provider": "University of Cape Town (edX and Coursera)",
      "items": [
        {
          "name": "UCT online short courses and MOOCs",
          "cost": "free to audit, paid certificate optional, verified July 2026",
          "url": "https://www.edx.org/school/uct",
          "whyHtml": "A respected local university name on your CV, auditable for free, which carries weight with South African employers who know UCT."
        }
      ]
    },
    {
      "provider": "University of the Witwatersrand (Digital Campus)",
      "items": [
        {
          "name": "Wits online short courses",
          "cost": "paid short courses, verified July 2026 (check current fees on the site)",
          "url": "https://www.digitalcampus.co.za/online-short-courses/",
          "whyHtml": "Short, focused Wits certified courses that add a trusted South African university credential to your profile for specific in demand skills."
        }
      ]
    },
    {
      "provider": "CodeSpace Academy",
      "items": [
        {
          "name": "Coding bootcamps (short and intensive)",
          "cost": "paid, 3 to 10 month options depending on specialisation, verified July 2026",
          "url": "https://www.codespace.co.za/",
          "whyHtml": "A local, mentor led bootcamp with a job focus, a faster route into software work than a full degree and built for the South African market."
        }
      ]
    },
    {
      "provider": "HyperionDev",
      "items": [
        {
          "name": "Software Engineering and Data Science bootcamps",
          "cost": "paid up to about R80 000, with a free trial and a 37 percent needs based South African scholarship, verified July 2026",
          "url": "https://www.hyperiondev.com/",
          "whyHtml": "A well known South African bootcamp with human code review and a scholarship for unemployed or full time students, lowering the cost of a career switch."
        }
      ]
    },
    {
      "provider": "Umuzi",
      "items": [
        {
          "name": "Digital skills training programme",
          "cost": "tuition free, 12 months, students receive a monthly stipend, verified July 2026",
          "url": "https://www.umuzi.org/",
          "whyHtml": "Free training that even pays you a stipend while you learn, removing the money worry entirely for young South Africans breaking into tech."
        }
      ]
    },
    {
      "provider": "WeThinkCode_",
      "items": [
        {
          "name": "Software development programme",
          "cost": "100 percent tuition free, 16 months, ages 17 to 35, verified July 2026",
          "url": "https://wethinkcode.co.za/",
          "whyHtml": "Free, peer to peer coding training with about 91 percent of graduates landing permanent jobs, one of the strongest no cost routes into a developer career in South Africa."
        }
      ]
    }
  ],
  "usecases": [
    {
      "company": "Capitec",
      "sector": "Banking",
      "whatHtml": "Built a graph machine learning fraud pipeline (using Memgraph) that scores more than 3.5 million records a day in about two hours across seven live graphs, spotting scam payments, mule accounts and fraudulent recipients in real time. It has also rolled out agentic and generative AI to nearly 5,000 staff.",
      "impactHtml": "AI fraud tools saved clients R673 million in the 2026 financial year, stopping over 394,000 scam payments, blocking 131,000 fraudulent recipients and shutting more than 80,000 mule accounts, at a monthly false positive rate of about 2.1 percent."
    },
    {
      "company": "TymeBank",
      "sector": "Banking",
      "whatHtml": "Uses in-house AI-driven credit risk models and alternative data (helped by a data analytics and credit-risk partnership with Brazil's Nubank) to lend to customers who lack a traditional credit history, and to score risk at low cost for its digital-only, kiosk-plus-app model.",
      "impactHtml": "TymeBank/Tyme Group uses AI and alternative data (bolstered by a data-analytics and credit-risk partnership with Brazil's Nubank, which took ~10% in its Series D) to score and lend to thin-file customers at low cost via its digital-only kiosk-plus-app model, with SME lending (merchant cash advances) up around 30% year-on-year in 2024. TymeBank South Africa reached profitability in December 2023, and Tyme Group achieved unicorn status at a $1.5bn valuation in late 2024 (not 2025). By June 2025 the group served about 17.5 million customers across South Africa and the Philippines, adding roughly 450,000 a month."
    },
    {
      "company": "Standard Bank",
      "sector": "Banking",
      "whatHtml": "Embedded AI into its 2026 to 2028 strategy: an AI recommendation engine called SmartNudge for business cross-selling, conversational AI across its mobile apps, AI-driven marketing, and an internal Microsoft Copilot Studio service-desk bot named Karabo. Runs on cloud and Microsoft Power Platform.",
      "impactHtml": "AI-enabled cross-sell tools lifted campaign outcomes by about 20 percent, SmartNudge reaches a 66 percent acceptance rate, conversational AI now handles about 65 percent of all digital queries, and the Karabo bot resolves about 99 percent of employee IT queries. Standard Bank ranked second in the Evident AI Index for Banks, Middle East and Africa."
    },
    {
      "company": "Nedbank",
      "sector": "Banking",
      "whatHtml": "Deployed roughly 30 advanced AI use cases in 2025, including Microsoft Copilot for customer engagement across 13 South African languages and Azure-based compliance and data-privacy tooling, to automate internal work and speed up payments processing.",
      "impactHtml": "The 2025 AI programme saved about 312,000 staff hours, cut global payment processing times by around 30 percent, and delivered roughly R186 million in realised benefits. Nedbank placed fourth in the Evident AI Index for Banks, Middle East and Africa."
    },
    {
      "company": "Discovery (Vitality)",
      "sector": "Insurance and health",
      "whatHtml": "Partnered with Google Cloud to build Vitality AI on Vertex AI and Gemini, mining a de-identified dataset of more than 2,800 dimensions of lifestyle, clinical and behavioural data to personalise health screening and nudges for members.",
      "impactHtml": "Personalised, data-backed screening drove a 5.5 times increase in screening rates in fully funded healthcare settings and a 19 percent improvement in early cancer detection, with actuarial value for insurers through lower healthcare costs and improved loss ratios. Rollout is planned across Vitality's global base of about 13 million customers from 2026."
    },
    {
      "company": "Naked Insurance",
      "sector": "Insurance",
      "whatHtml": "A fully digital insurer that uses AI to assess risk and generate binding car, home and single-item quotes in about 90 seconds, and handle claims and cover changes without a call centre. In 2026 it became the first insurer in the world to give a final, binding car insurance quote inside a native ChatGPT app.",
      "impactHtml": "Exact profit figures are not public, but the AI-first model let Naked run 100 percent of its policies online and raise a 38 million US dollar Series B extension in early 2025 (from IFC, DEG, BlueOrchard, Yellowwoods and Hollard), reported as the largest insurtech investment in Africa, to scale its AI-powered growth."
    },
    {
      "company": "Shoprite (Checkers Sixty60)",
      "sector": "Retail",
      "whatHtml": "Through its Shoprite X innovation hub, feeds Xtra Savings loyalty data (about 2,500 card swipes a minute, said to be Africa's largest consumer dataset) into AI for demand forecasting, dynamic pricing and stock optimisation. It uses a machine learning algorithm to define optimal Sixty60 delivery regions in real time, and launched Pixie, a swipe-based AI shopping assistant that predicts and suggests grocery orders.",
      "impactHtml": "Through its ShopriteX innovation hub, Shoprite feeds Xtra Savings loyalty data (about 2,500 card swipes a minute, since risen to ~2,700, from tens of millions of members, one of the largest consumer datasets in Africa) into AI for demand forecasting, pricing and stock optimisation. It uses a machine-learning algorithm to define optimal Sixty60 delivery regions, and launched Pixie, a swipe-based AI shopping assistant that predicts and suggests grocery orders. Rand savings are not published, but data-driven forecasting cuts costs and stockouts, ML delivery-zone routing helps meet the 60-minute window, and Pixie became one of Sixty60's fastest-adopted features, used by about 98% of Xtra Savings Plus members, deepening basket size on a service that grew into roughly US$1 billion in annual sales (FY2025 sales ~R18.9bn), not a business \"worth\" $1 billion.\n\nSources:\n- https://techcentral.co.za/how-shoprite-is-using-ai-more-groceries/253336/\n- https://www.dailymaverick.co.za/article/2022-11-13-artificial-intelligence-is-playing-a-bigger-role-in-retail-and-shoprite-is-leading-the-race/\n- https://www.shopriteholdings.co.za/newsroom/2022/the-shoprite-group-innovates-using-ai.html\n- https://www.news24.com/business/companies/embargo-for-0830-monday-morning-shoprite-says-tinder-style-ai-shopping-assistant-on-sixty60-is-a-massive-hit-20260711-0631\n- https://www.itweb.co.za/article/shoprite-adds-ai-shopping-assistant-to-sixty60-app/rxP3jqBELozMA2ye\n- https://africannewsagency.com/shoprites-ai-pixie-reaches-98-adoption-among-sixty60-members/\n- https://launchbaseafrica.com/2025/10/16/sixty60-the-1-7m-seed-investment-that-built-a-1b-delivery-empire-for-shoprite/"
    },
    {
      "company": "Vodacom",
      "sector": "Telecommunications",
      "whatHtml": "Signed a multi-year collaboration with Google Cloud (announced November 2025) to unify fragmented network, billing, support and mobile-money data into a single BigQuery backbone and use Vertex AI and Gemini to optimise network performance, personalise customer care and fight fraud with machine learning.",
      "impactHtml": "Real and largely accurate, with one figure to drop. On 25 November 2025 Vodacom Group announced a multi-year strategic collaboration with Google Cloud to migrate and unify its critical data platforms onto Google Cloud's data cloud (including BigQuery) as a single secure source of truth, and to apply Vertex AI and Gemini (plus Veo and Imagen) to optimise network performance, personalise customer care, and detect fraud with machine learning, across a group serving more than 223.2 million customers (93.7 million financial services users). Remove the \"roughly 1 billion US dollar\" figure: no official Vodacom or Google Cloud disclosure states a deal value, and the $1B number originates only from a single third-party analysis headline that presents it speculatively as a question with no sourcing. Financial terms were not disclosed. Sources: Vodacom (https://www.vodacom.com/news-article.php?articleID=16507), Google Cloud press corner (https://www.googlecloudpresscorner.com/2025-11-25-Vodacom-Announces-Multi-Year-Strategic-Collaboration-with-Google-Cloud-to-Boost-Africas-AI-Advancement), PR Newswire (https://www.prnewswire.com/news-releases/vodacom-announces-multi-year-strategic-collaboration-with-google-cloud-to-boost-africas-ai-advancement-302624944.html), Connecting Africa (https://www.connectingafrica.com/ai/vodacom-google-cloud-sign-multi-year-deal-to-advance-ai-services). The unsourced $1B claim: Global Data Center Hub (https://www.globaldatacenterhub.com/p/will-vodacoms-1b-google-cloud-bet)."
    },
    {
      "company": "MultiChoice (Showmax)",
      "sector": "Media and streaming",
      "whatHtml": "Showmax uses a machine learning recommendation engine (built with personalisation vendor Recombee) that analyses viewing behaviour, genre and other signals to auto-curate personalised content rows and surface what each subscriber is most likely to watch.",
      "impactHtml": "Exact figures are not public, but the recommendation system is credited with higher engagement and conversion and lower subscriber churn by helping viewers find value faster, a key retention lever for MultiChoice's streaming push against global players."
    },
    {
      "company": "FNB (FirstRand)",
      "sector": "Banking",
      "whatHtml": "Uses AI, machine learning and robotics to personalise product offers, and built a machine learning application called Manila to automate regulatory decisions faster and more accurately. Rolled out Navi, an AI virtual assistant in the banking app, and later embedded AI into advisor workflows for real-time, human-backed digital support.",
      "impactHtml": "Specific rand impact is not disclosed, but the AI tooling targets faster, more accurate regulatory decisions and personalised cross-sell to a South African base where digitally active banking customers now exceed 23 million, defending market share against digital challengers."
    }
  ],
  "links": [
    {
      "title": "The different levels of how Claude thinks",
      "url": "https://youtu.be/rKV5JcALQoQ",
      "kind": "video",
      "note": "Anthropic walks through the layers of Claude's internal reasoning in plain terms."
    },
    {
      "title": "A global workspace in language models (Anthropic Research)",
      "url": "https://www.anthropic.com/research/global-workspace",
      "kind": "article",
      "note": "The research page behind the video, on the J-space workspace that emerged inside Claude."
    },
    {
      "title": "But what is a neural network? (Deep learning chapter 1) by 3Blue1Brown",
      "url": "https://www.youtube.com/watch?v=aircAruvnKk",
      "kind": "video",
      "note": "The famous visual first lesson that makes neurons and weights click for beginners."
    },
    {
      "title": "Neural networks series (full playlist) by 3Blue1Brown",
      "url": "https://www.youtube.com/playlist?list=PLZZWrBYkx7Otcjr3eCLZDCgfpqnxMY29s",
      "kind": "video",
      "note": "The whole chapter by chapter series, from a single neuron up to how networks learn."
    },
    {
      "title": "Introduction to Generative AI (Google Cloud Tech)",
      "url": "https://www.youtube.com/watch?v=cZaNf2rA30k",
      "kind": "video",
      "note": "A short reputable explainer of what generative AI is and how it differs from older ML."
    },
    {
      "title": "What are AI Agents? (IBM Technology)",
      "url": "https://www.youtube.com/watch?v=F8NKVhkZZWI",
      "kind": "video",
      "note": "IBM breaks down agents that plan, use tools, and act on your behalf."
    },
    {
      "title": "[1hr Talk] Intro to Large Language Models by Andrej Karpathy",
      "url": "https://www.youtube.com/watch?v=zjkBMFhNj_g",
      "kind": "video",
      "note": "A one hour, no-maths tour of LLMs from a leading AI researcher."
    },
    {
      "title": "Deep Dive into LLMs like ChatGPT by Andrej Karpathy",
      "url": "https://www.youtube.com/watch?v=7xTGNNLPyMI",
      "kind": "video",
      "note": "The longer 3.5 hour follow up covering the full training stack, still general audience."
    },
    {
      "title": "Learn Python, Full Course for Beginners (freeCodeCamp)",
      "url": "https://www.youtube.com/watch?v=rfscVS0vtbw",
      "kind": "course",
      "note": "A complete beginner Python course, no prior coding needed, free on YouTube."
    },
    {
      "title": "Prompt engineering overview (Anthropic docs)",
      "url": "https://platform.claude.com/docs/en/docs/prompt-engineering",
      "kind": "docs",
      "note": "Anthropic's own guide to writing better prompts, with an interactive tutorial linked."
    },
    {
      "title": "Gemini for Google Workspace Prompt Guide",
      "url": "https://workspace.google.com/learning/content/gemini-prompt-guide",
      "kind": "docs",
      "note": "Google's practical prompting handbook built around persona, task, context, and format."
    },
    {
      "title": "Why Large Language Models Hallucinate (IBM Technology)",
      "url": "https://www.youtube.com/watch?v=cfqtFvWOfg0",
      "kind": "video",
      "note": "Explains why chatbots confidently make things up and how to stay sceptical."
    },
    {
      "title": "Context windows (Anthropic docs)",
      "url": "https://platform.claude.com/docs/en/docs/build-with-claude/context-windows",
      "kind": "docs",
      "note": "Clear explanation of the context window as a model's working memory, and why bigger is not always better."
    },
    {
      "title": "What is Cloud Computing? (Google Cloud Tech)",
      "url": "https://www.youtube.com/watch?v=7dTsB5yvmf4",
      "kind": "video",
      "note": "A plain intro to what the cloud actually is, from Google's core infrastructure series."
    },
    {
      "title": "Data Analysis with Python, Full Course for Beginners (freeCodeCamp)",
      "url": "https://www.youtube.com/watch?v=r-uOLxNrNk8",
      "kind": "course",
      "note": "A free 4 hour intro to analysing data with NumPy, Pandas, Matplotlib, and Seaborn."
    },
    {
      "title": "ChatGPT (official homepage)",
      "url": "https://chatgpt.com",
      "kind": "tool",
      "note": "OpenAI's ChatGPT, the official product to sign up and experiment with."
    },
    {
      "title": "Claude (official homepage)",
      "url": "https://claude.ai",
      "kind": "tool",
      "note": "Anthropic's Claude, the official product homepage."
    },
    {
      "title": "Gemini (official homepage)",
      "url": "https://gemini.google.com",
      "kind": "tool",
      "note": "Google's Gemini assistant, official landing page."
    },
    {
      "title": "Llama by Meta (official homepage)",
      "url": "https://www.llama.com",
      "kind": "tool",
      "note": "Meta's open Llama models, official homepage."
    }
  ]
};
