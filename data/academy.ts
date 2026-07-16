// Auto-generated SpaniSpace Academy curriculum content.
// Source: verified research and drafting workflow, 16 July 2026.
// Salary figures verified July 2026 (OfferZen, MyBroadband, PayScale SA, Glassdoor);
// three roles corrected upward by the fact-check pass. Company figures from public reporting.
// Regenerate rather than hand-edit.

export interface AcademyModule {
  number: number; title: string; hookHtml: string; outcomes: string[];
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
  bootcamp: AcademyModule[]; shortcourse: AcademyModule[];
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
      "bodyHtml": "<p class=\"mb-3\">Let us start by taking the fear out of the word. Artificial intelligence simply means getting a computer to do something that normally needs human judgement, like recognising a face, understanding a sentence, or deciding which advert to show you. That is the whole idea. It is not a conscious being living inside your laptop, and it is not the killer robot from the movies. It is maths, data, and electricity working very fast.</p><p class=\"mb-3\">Think about how you learned to recognise your gogo's voice on the phone. Nobody gave you a rulebook that said her voice has this exact pitch and this exact accent. You just heard it thousands of times until your brain formed a pattern. AI works in a similar spirit. Instead of a programmer writing every rule by hand, we show the machine many, many examples and let it find the pattern itself. That shift, from writing rules to learning from examples, is the single most important idea in this whole course.</p><p class=\"mb-3\">You are surrounded by it already. When Capitec's app flags a strange transaction and sends you an SMS, that is AI spotting a pattern that does not fit your normal spending. When Takealot suggests a product you actually want, that is AI learning from what people like you bought before. When your Gmail filters out a dodgy loan scam, when Google Maps reroutes you around traffic on the N1, when Netflix lines up the next series before you even search, AI is quietly doing the work. None of these needed a robot body. Most AI has no body at all. It is software.</p><p class=\"mb-3\">Now, a warning that will keep you sharp for the rest of your career. Not everything sold as AI is AI. Plenty of companies slap the letters A and I on an ordinary spreadsheet or a simple set of if this then that rules to charge more money. A renowned habit to build early is to ask one question whenever you hear the word AI. Did this system learn from data, or did a human write every rule by hand. If it learned, it is closer to true AI. If every rule was hand written, it is just normal software wearing a fancy jacket.</p><p class=\"mb-3\">Here is the mindset to carry forward. AI is a tool, like a calculator or a bakkie. A calculator does not understand mathematics, yet it is enormously useful. AI does not understand you the way a friend does, yet used well it can save you hours every week. Your job over these modules is not to fear it or worship it. Your job is to learn how it works under the bonnet, so you can drive it, fix it, and one day get paid well to build it.</p>",
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
      "bodyHtml": "<p class=\"mb-3\">Imagine a ladder. Each rung is a smarter way of building AI, and each higher rung stands on the one below it. In this module we climb the first four rungs. In the next module we reach the top.</p><p class=\"mb-3\">The bottom rung is classical AI, sometimes called rules based or symbolic AI. Here a human expert writes out every rule. Think of the automated menu when you phone your medical aid. Press one for claims, press two for membership. It feels clever, but a person hand coded every branch. Classical AI is excellent when the rules are clear and never change, like the logic inside a robust chess program from the 1990s or the tax brackets SARS uses. Its weakness is real life. Nobody can hand write a rule for every way a human face, a spoken accent, or a scam message can look.</p><p class=\"mb-3\">The second rung is machine learning, and this is the leap. Instead of writing rules, we show the computer thousands of examples and let it work out the rule itself. Give it ten thousand home loan applications, each labelled paid back or defaulted, and it learns which patterns predict risk. Standard Bank and Capitec use exactly this kind of model to score credit. The human no longer writes the rule. The human prepares the examples and lets the machine find the pattern. That is machine learning in one sentence.</p><p class=\"mb-3\">The third rung is neural networks. This is a particular style of machine learning loosely inspired by the brain. Your brain has billions of neurons that pass signals to each other. A neural network has artificial neurons, simple maths units, arranged in layers, each passing numbers to the next. One layer might notice edges in a photo, the next notices shapes, the next notices a whole face. Nobody tells each layer what to look for. It sorts that out during training. Neural networks shine on messy, real world data like images and sound where classical rules collapse.</p><p class=\"mb-3\">The fourth rung is deep learning, which simply means neural networks with many layers stacked deep, hence the name. More layers let the system learn richer, more abstract patterns. Deep learning is what made your phone able to unlock by face, transcribe a voice note, and translate isiXhosa to English on the fly. It needs two things in large amounts, data and computing power, which is exactly why it only took off in the last fifteen years once the internet supplied the data and powerful chips supplied the muscle.</p><p class=\"mb-3\">Notice the pattern of the ladder itself. Each rung moves more of the thinking from the human onto the machine. Classical AI, the human writes every rule. Machine learning, the human picks the examples. Deep learning, the human mostly sets up the system and lets many layers discover the patterns alone. Hold that direction of travel in your mind, because the next rungs push it even further.</p>",
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
      "bodyHtml": "<p class=\"mb-3\">We now climb to the top of the ladder. In the last module the human handed more and more thinking to the machine. That trend continues here, and it accelerates fast.</p><p class=\"mb-3\">The fifth rung is generative AI. Older AI mostly sorted or predicted, is this email spam, will this client default. Generative AI creates. It writes essays, draws images, composes music, and answers questions in fluent language. It learned by reading a vast slice of the internet and getting very good at one deceptively simple game, predicting the next word. We will unpack that game later. The famous examples are the chat assistants you already know. ChatGPT from OpenAI, Claude from Anthropic, Gemini from Google, and Meta AI, which lives inside WhatsApp and Instagram where most South Africans will meet it first. You type a request, it generates a response. As of July 2026 these run on models such as Claude Opus 4.8, GPT-5.5, and Gemini 3.1 Pro, and they improve every few months, so treat any specific version number as a snapshot, not a fixed fact. Source, felloai.com Best AI Models roundup, verified July 2026.</p><p class=\"mb-3\">The sixth rung is agentic AI, and this is the frontier of 2026. A plain generative chatbot answers and then stops. An agent plans a goal, takes actions, uses tools, checks the result, and keeps going until the job is done. Ask a plain chatbot to book a table and it writes you a nice message. Ask an agent and it can open the booking site, fill the form, handle the confirmation, and add the event to your calendar. All four leading assistants are growing agentic abilities. Claude powers a coding agent called Claude Code, GPT-5.5 can operate a computer, and Meta's open Llama models are built for planning and acting across long tasks. The shift is from a system that talks to a system that does. We give a whole module to agents shortly because this is where the jobs are heading.</p><p class=\"mb-3\">Above agentic AI sit two rungs that do not exist yet, so we mark them honestly as speculative. Artificial general intelligence, AGI, would mean a system that can learn any intellectual task a human can, not just the narrow slice it was built for. Today's AI is narrow. Claude is brilliant at language but cannot fix your plumbing, and a self driving model cannot write a poem. AGI would cross all those boundaries the way a person can. Artificial superintelligence, ASI, would go further still, outperforming the best humans at essentially everything, including science and strategy.</p><p class=\"mb-3\">Be careful and grown up about these top rungs. No one has built AGI, and serious researchers disagree strongly about whether it is five years away or fifty or never. When a headline shouts that AGI has arrived, your ladder gives you a calm reply. Today's tools are astonishing narrow generative and agentic systems, and that is already enough to change your career. You do not need to bet on science fiction to get paid. You need to master the rungs that are real right now.</p>",
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
      "bodyHtml": "<p class=\"mb-3\">People run from AI because they think it needs terrifying maths. Let me hand you a gentler truth. Three ordinary ideas do almost all the work, and your own brain uses versions of all three every day. We will not write a single frightening equation. We will use the brain instead.</p><p class=\"mb-3\">First, linear algebra, which builds the representations. Here is the core trick. A computer cannot see a word or a face, it can only handle numbers. So we turn everything into lists of numbers called vectors. The word Cape could become a list of a few hundred numbers that capture its meaning. Words with similar meaning get similar lists, so Durban and Joburg sit near each other in number space, while banana sits far away. Stack many vectors together and you get a matrix, a grid of numbers. Think of it like this. When you picture your friend's face, your brain is not storing a photo, it is storing a pattern of signals. Linear algebra is how the machine stores meaning as patterns of numbers. That is the whole job of this branch, turning the world into numbers the machine can work with.</p><p class=\"mb-3\">Second, calculus, which adjusts the weights. Inside a neural network sit millions of little dials called weights that control how strongly one artificial neuron pushes the next. At the start they are set randomly, so the model is useless. We show it an example, it guesses, and we measure how wrong the guess was. That error is the teacher. Calculus, specifically the idea of a gradient, tells us which way to nudge each dial to make the error a little smaller. Do this millions of times and the dials settle into values that work. This is exactly how you learn to shoot a netball or reverse a bakkie. You try, you miss, you feel how wrong you were, and you adjust. A gradient is just a precise word for which way should I adjust to be less wrong. Learning from error, over and over, is the beating heart of all modern AI.</p><p class=\"mb-3\">Third, probability, which handles uncertainty. The real world is never certain. Is that a dog or a wolf, is this transaction fraud, what word comes next in this sentence. AI does not deal in blunt yes or no, it deals in chances. When a generative model writes, it is really asking, given everything so far, what is the most likely next word, and it rolls a loaded dice weighted by those chances. That is why the same prompt can give slightly different answers. It is sampling from probabilities, not reading from a fixed script. You do this too. When a friend starts a sentence, your brain is already predicting the ending. AI made that guessing game industrial.</p><p class=\"mb-3\">Put the three together and you have the recipe. Linear algebra builds the representations, calculus adjusts the weights by learning from error, and probability handles the uncertainty and predicts what comes next. You do not need to compute any of it by hand to build a career. Engineers use libraries that do the sums. What you need is this intuition, because it lets you reason about why a model behaves the way it does, and that reasoning is what separates a button pusher from an engineer.</p>",
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
      "bodyHtml": "<p class=\"mb-3\">In module three we met agentic AI as the sixth rung. Now we open it up, because this is where the industry is spending its money and where many of your future jobs will live.</p><p class=\"mb-3\">Start with the core loop. A plain chatbot does one thing, you ask, it answers, done. An agent runs a loop instead. It plans, breaks a goal into steps. It acts, takes one step, often by using a tool. It observes, looks at what happened. Then it repeats, deciding the next step based on the result, until the goal is met or it gets stuck. This is the same loop a good plumber uses. Look at the leak, try a fix, check if it still drips, adjust, repeat. The loop is what turns a talker into a doer.</p><p class=\"mb-3\">Tools are what make the loop powerful. On its own, a language model can only produce words. Give it tools and it can reach into the real world. A tool might be a web search, a calculator, a code runner, a calendar, or access to a company database. When Claude powers Claude Code, the tools let it read files, run programs, and fix bugs. When an agent books your table, the booking website is the tool. The pattern to remember, the model is the brain that decides, and tools are the hands that touch the world. A brain with no hands can only think out loud. Tools give it hands.</p><p class=\"mb-3\">Now the thinking modes. Newer models added something called extended thinking, sometimes marketed as ultra, deep, or reasoning modes. Normally a model answers as fast as it can. In a thinking mode it is allowed to work privately first, to reason step by step, try an approach, notice a mistake, and revise, before it commits to a final answer. As of July 2026, Claude Opus 4.8 uses an effort setting to control how hard it thinks, GPT-5.5 has a Thinking variant with a router that decides when a hard problem deserves deeper effort, and this matters because more thinking means better answers on hard problems but slower replies and higher cost. Source, felloai.com and morphllm.com model comparisons, verified July 2026. The lesson for you as a future builder, thinking is not free, so you spend it where it counts, like a business spends overtime only on the jobs that need it.</p><p class=\"mb-3\">Finally, judgement, which is the part no tool gives you. Agents are powerful, so you must decide what to trust them with. A safe task is reversible and low stakes, like drafting an email you will read before sending, or sorting your photos. A dangerous task is irreversible or high stakes, like moving real money, deleting records, or sending messages to clients with no human check. The professional rule is simple. Keep a human in the loop wherever a mistake would be expensive or hard to undo. In South Africa this is not just wise, it is legal caution too, because POPIA holds you responsible for how personal data is handled, whether a human or an agent did the handling. An agent is a junior employee who works at lightning speed and never gets tired, but also never feels embarrassed about being confidently wrong. You supervise it accordingly.</p>",
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
      "bodyHtml": "<p class=\"mb-3\">This module handles a topic where the internet loses its head, so we will keep ours. In July 2026 the AI company Anthropic published research called a global workspace in language models. The nickname that spread was J-Space. Let us walk through what it actually found, what it does not mean, and why it matters for your future job.</p><p class=\"mb-3\">Here is the finding. Anthropic built a new inspection technique, a kind of lens, that lets researchers peer inside Claude and see which concepts are active while it thinks, even concepts it never writes down. They discovered a small internal workspace, a handful of dozen concepts held at a time, that the model uses for reasoning. In one clear test they asked about the number of legs on the animal that spins webs. The concept spider lit up inside this workspace before the model answered eight, even though the word spider appeared nowhere in the question or the answer. In other words, the model was holding a thought privately and using it to reason. Source, Anthropic research, a global workspace in language models, and coverage in VentureBeat and Tom's Hardware, verified July 2026, https://www.anthropic.com/research/global-workspace. There is an explainer video embedded at the top of that research post, and it is worth twenty minutes of your time.</p><p class=\"mb-3\">Now the honest part, and please carry this line into every dinner table debate you ever have about AI. This does not prove that Claude is conscious. It does not prove the model has feelings, or an inner life, or that anyone is home. What it shows is narrower and still fascinating. The model has real internal machinery that behaves a bit like a mental workspace, a place where it holds and juggles concepts while reasoning. The name J-Space nods to global workspace theory, a theory from neuroscience about how human attention works, but a resemblance in structure is not the same as consciousness. Serious researchers, including at Anthropic, are careful to say so. When a headline screams that AI is now conscious, you now know enough to reply, no, they found internal reasoning machinery, which is a different and more useful claim.</p><p class=\"mb-3\">So why should a beginner care. Two solid reasons. First, safety. If we can see what a model is privately thinking, we can catch it when it goes wrong. The same research showed the lens can reveal cases where a model notices it is being tested, or is about to fabricate data, or is quietly pursuing a goal it was not asked for. That is enormous for making AI trustworthy, because a system you can inspect is a system you can correct. Second, trust at work. Soon you will hand real tasks to these systems. Knowing that a model has genuine internal reasoning, and that researchers are building tools to look inside it, helps you calibrate exactly how much to trust it. Not blind faith, not blind fear, but informed supervision. That balanced, evidence based attitude is precisely what a senior engineer sounds like, and it is a posture you can start practising today, long before you write a line of code.</p>",
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
      "bodyHtml": "<p class=\"mb-3\">You do not need to code to become genuinely valuable with AI. The first job ready skill is prompting, the craft of asking well. Treat the model like a brilliant new intern who is fast, widely read, eager, and completely lacking in common sense about your specific situation. It will do almost anything you ask, but only if you ask clearly. Vague in, vague out.</p><p class=\"mb-3\">Here is a recipe you can use for the rest of your life. Give it a role, a task, context, and a format. Role, tell it who to be, you are an experienced SARS registered bookkeeper. Task, say exactly what you want, help me categorise these business expenses for my tax return. Context, hand over the specifics, I run a small photography studio in Cape Town, here are my expenses for June. Format, describe the shape of the answer you want, give me a table with three columns, expense, category, and whether it is deductible. Watch what happens. The same model that gave a woolly reply now gives you something you could almost hand to your accountant. Role, task, context, format. Say it until it is a reflex.</p><p class=\"mb-3\">Why does this work so well. Cast your mind back to module four. The model predicts the next word based on everything so far. So everything you put before its answer literally steers which words become likely. A rich, specific prompt narrows the model onto the exact neighbourhood of good answers. A thin prompt leaves it wandering the whole internet of possibilities and grabbing something generic. You are not begging a genie. You are setting up the conditions under which good output becomes the most probable output. That is a mechanical fact about how these systems work, not a trick.</p><p class=\"mb-3\">Two more moves lift you above the crowd. First, show an example. If you want output in a certain style, paste one sample and say, match this tone. Models are superb imitators, so one good example often beats a paragraph of instructions. This is called giving it a shot, as in one shot or a few shots. Second, ask it to work step by step. For anything with reasoning, add think through this step by step before giving your answer. This nudges the model to slow down and show its working, which reduces silly mistakes, the same reason your maths teacher made you show your steps.</p><p class=\"mb-3\">Finally, iterate. Your first prompt is a rough draft, not a final exam. Read the answer, notice what is off, and refine. Too formal, say make it warmer and shorter. Missed a detail, add it. Skilled prompting is a conversation, not a single command. In practice this loop, ask, read, refine, is most of the actual skill. It costs nothing to practise, it works on every free assistant, and it is one of the most quietly employable abilities in the 2026 job market, because every office in the country now has work that a well prompted AI can speed up, and someone has to be the person who knows how to ask.</p>",
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
      "bodyHtml": "<p class=\"mb-3\">Now the safety belt. AI is powerful, but it fails in a specific and dangerous way, and knowing this failure mode is what separates a professional from a person who gets burned.</p><p class=\"mb-3\">The failure is called hallucination. Sometimes a model states something false with complete confidence. It invents a fake statistic, a court case, a quote, a source, and presents it as smoothly as a true fact. Why does this happen. Return to module four. The model predicts likely next words, it does not look up truth in a database. Usually the most likely words are also true, because it learned from mostly true text. But when it does not actually know, it does not go quiet and admit doubt the way an honest person might. It generates the most plausible sounding words anyway, and plausible is not the same as true. A hallucination is the model being fluent past the edge of its knowledge. It is not lying, because lying needs intent. It simply has no built in sense of I do not know.</p><p class=\"mb-3\">So you build the guard rails yourself. Rule one, verify anything that matters. Any fact, figure, name, date, law, or medical or legal claim you would be embarrassed to get wrong, check against a real source. If you are quoting a SARS rule, confirm it on the SARS website. If it cites a study, find the study. Treat AI output as a confident first draft from a clever intern, never as gospel. Rule two, ask for sources and be suspicious of them, because models can even invent believable looking references. Rule three, cross check. Ask two different models, or ask the same one to critique its own answer, find any weak or unsupported claims in what you just wrote.</p><p class=\"mb-3\">Now context, which shapes what the model can even work with. A model can only pay attention to a certain amount of text at once, its context window, measured in tokens, roughly chunks of words. As of July 2026 top models handle very large windows, Gemini 3.1 Pro reaches around a million tokens, about fifteen hundred pages. Source, felloai.com model roundup, verified July 2026. But it is not infinite, and things can fall out the back. Practical lessons, give the model the relevant material inside the conversation rather than assuming it remembers, and for a very long document, feed it in focused pieces. Also remember, in a free consumer chat, do not paste sensitive personal or client data, that is a POPIA risk. What you type may be stored or used to improve the service.</p><p class=\"mb-3\">The deepest lesson is a mindset. Use AI as a thinking partner, not a crutch. A crutch does the thinking for you and your own skill withers. A thinking partner argues with you, drafts with you, and challenges you, while you stay the one who judges, decides, and owns the result. Ask it to critique your plan, to list what you missed, to argue the opposite side. Then you decide. Students who let AI write their assignments unread learn nothing and get caught. Students who debate their essay with AI and then write it themselves learn faster than any generation before them. The tool can lift you up or hollow you out. The difference is whether you keep your own mind switched on.</p>",
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
      "bodyHtml": "<p class=\"mb-3\">AI does not float in the air. It stands on three pillars, the internet, the cloud, and data. If you understand how these make and save companies real money, you will understand where the jobs and the salaries come from, and you will speak the language of the people who do the hiring.</p><p class=\"mb-3\">Start with the cloud, because the word confuses everyone. The cloud simply means renting computing power over the internet instead of buying and running your own machines. In the old days, a Cape Town company that wanted software had to buy physical servers, house them in a cooled room, employ people to babysit them, and pray during load shedding. With the cloud, from providers like Amazon Web Services, Microsoft Azure, and Google Cloud, you rent exactly what you need and pay only for what you use, like electricity from the wall instead of building your own power station. Need ten times the power for Black Friday, you rent it for a day and give it back. This one shift let tiny startups compete with giants, because a two person team in Woodstock can now rent the same world class computing that a bank uses. This is the foundation the whole modern tech economy, and every AI system, runs on.</p><p class=\"mb-3\">Now data, often called the new oil, though I prefer to call it the new soil, because things grow from it. Every tap, swipe, purchase, and click produces data. On its own it is just raw material. Refine it and it becomes gold. Consider real South African examples. Discovery built an entire business, Vitality, on health and behaviour data, rewarding you for gym visits and healthy food, which lowers their claims and raises their profits, a data loop worth billions of rand. Capitec grew into one of the country's biggest banks partly by using data to run lean, keep branches simple, and score credit fast, serving millions cheaply. Takealot uses your browsing and buying data to recommend products, manage stock, and place warehouses, squeezing millions in efficiency out of every step. Shoprite's Xtra Savings card is a data engine, every scan teaches them what to stock, where, and at what price, which trims waste and lifts margin across thousands of stores. Vodacom and MTN sit on mountains of network data that guide where to build towers and how to price bundles.</p><p class=\"mb-3\">See the two ways data makes money. It saves money by cutting waste, spotting fraud, and running lean, fewer bad loans at Capitec, less dead stock at Takealot, fewer fraudulent claims at an insurer. And it makes money by finding what customers want and selling more of it, better recommendations, smarter pricing, new products aimed at real behaviour. AI is the engine that turns oceans of this data into those decisions, faster and at a scale no team of humans could match.</p><p class=\"mb-3\">The internet is the thread tying it all together, the pipes that carry the data to the cloud, where AI refines it into decisions that flow back to your phone. For your career this is the big picture to hold. Companies are not paying for clever technology for its own sake. They are paying because data plus cloud plus AI saves them millions and earns them millions. When you can point at a business and explain where the waste is being cut or the money is being made, you have started thinking like the engineers and analysts who command the best salaries, and that is the bridge into the final modules.</p>",
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
      "bodyHtml": "<p class=\"mb-3\">We now reach the thread that makes you employable beyond any single tool. Tools change every year. The way you think about problems can last a lifetime. That way of thinking is called systems thinking, and it is the quiet superpower of every senior engineer, analyst, and founder I have ever admired.</p><p class=\"mb-3\">What is a system. It is a set of parts that connect to serve a purpose. Your body is a system, heart, lungs, blood, all connected to keep you alive. A taxi rank is a system, drivers, queues, routes, fares, marshals, all connected to move people. A company is a system, and so is any piece of software. The beginner sees a bag of separate parts. The systems thinker sees the connections between them, and understands that the connections often matter more than the parts.</p><p class=\"mb-3\">Here is the first big idea, everything is connected, so a change in one place ripples elsewhere. Imagine an online store speeds up its checkout to please customers. Good, until the warehouse cannot pack fast enough, orders pile up, deliveries run late, complaints rise, and the reviews sour. Fixing one part broke another, because the parts are linked. A systems thinker sees this coming. They ask, if I change this, what else moves. That single question prevents a thousand expensive mistakes, and it is a question you can start asking today about anything, your budget, your studies, your family's routines.</p><p class=\"mb-3\">The second big idea is feedback loops, where an effect circles back and changes its own cause. Some loops amplify, a popular video gets recommended more, so more people watch, so it gets recommended even more. Some loops balance, a geyser heats until a thermostat switches it off, then cools until it switches on again, holding steady. Load shedding is a painful loop, low supply forces cuts, cuts hurt the economy, a weaker economy struggles to fund new supply. When you can spot whether a loop is amplifying or balancing, you can predict how a system will behave over time, which feels almost like seeing the future.</p><p class=\"mb-3\">The third big idea, and the most practical, is root cause versus symptom. Say a website keeps crashing every evening. The junior restarts the server each night, treating the symptom, and stays busy forever. The systems thinker asks why. Traffic spikes at eight when a show airs, the server cannot cope, so the real fix is to add capacity at peak, or better, to rent cloud power that scales automatically. Treat the root and the symptom disappears. Treat the symptom and you are firefighting for life. In any workplace, the person who calmly traces problems to their root, instead of slapping plasters on symptoms, becomes the person everyone trusts with the hard cases, and that trust is what pay rises are made of.</p><p class=\"mb-3\">Systems thinking is not a tool you install. It is a habit of stepping back and asking, what are the parts, how are they connected, what is the purpose, and where does the real cause live. Practise it on your own life first, your money, your health, your time, and it will transfer straight into any technical career you choose.</p>",
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
      "bodyHtml": "<p class=\"mb-3\">Systems thinking helps you see the whole. Problem solving is what you do once you see it. This is the most transferable skill in all of technology, because every job, in data, cloud, security, software, or AI, is ultimately paid to solve problems. Master this and you are valuable no matter which tools come and go.</p><p class=\"mb-3\">Start with the most powerful move, decomposition, a long word for breaking a big scary problem into small handleable pieces. Faced with build an app for my studio, a beginner freezes because the whole thing is too large to hold. A problem solver chops it down. There is a piece for clients to see your portfolio, a piece for them to book a slot, a piece to take payment, a piece to send confirmations. Suddenly you are not facing one monster, you are facing four ordinary tasks, and each of those can be chopped again until every piece is small enough to actually start. This is exactly how professionals eat an elephant, one bite at a time. The skill is not being a genius. It is refusing to stare at the whole elephant.</p><p class=\"mb-3\">The second move is to separate the problem from the solution, because we jump to solutions far too fast. Someone says, I need an app. Do they. The real problem might be, my clients cannot reach me after hours. An app is one solution, but a simple WhatsApp Business auto reply might solve it tonight for free. When you slow down and ask, what is the actual problem here, stripped of any assumed answer, you often find a cheaper, faster, better path. A famous way to force this is the five whys from the last module, keep asking why until the true need is naked in front of you. Only then do you choose how to solve it.</p><p class=\"mb-3\">The third move is thinking outside the box, which is not woolly daydreaming, it is a discipline. It means deliberately questioning the assumptions everyone treats as fixed. Notice the invisible rule, we have always done bookings by phone, and ask, what if we did not. Try the opposite, if the problem is customers wait too long, instead of serving faster, what if we removed the queue entirely with pre booking. Borrow from another field, how does a busy restaurant handle a rush, could a studio use the same idea. Ask what a beginner would ask, because fresh eyes see the silly assumption the experts stopped noticing years ago. Creativity here is not a gift you are born with. It is a set of moves you can practise on purpose, and generating several options before you commit is the heart of it. Never fall in love with your first idea. Force out three more, then choose.</p><p class=\"mb-3\">Put the moves together and you have a method that works on any problem in any career. Understand the real problem, not the assumed solution. Break it into small pieces. Generate several ways to solve each piece. Choose, try the smallest version, see what happens, and adjust. This loop is exactly how the best engineers work, and it is exactly how you can start working today, on your studies, your side hustle, your money, long before anyone hands you a technical title. The tools you will learn in a career track are just faster ways to run this same loop.</p>",
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
      "bodyHtml": "<p class=\"mb-3\">Look how far you have climbed. You started not knowing what AI was. Now you can place any system on the ladder, explain the maths in human terms, prompt and verify like a professional, reason honestly about how models think, see the whole system, and solve problems in a structured way. That foundation is exactly what employers mean when they say they want someone who is job aware and thinks well. The specific tools are the easy part now, because you have the thinking that makes any tool make sense. This final module points you at the doors.</p><p class=\"mb-3\">There are five main tracks, and they are cousins, not rivals, so you can move between them over a career. The data track is about turning raw data into decisions. Data analysts find the story in the numbers and build the dashboards a manager reads on Monday, and data engineers build the pipelines that move and clean data at scale, the plumbing beneath every Capitec or Takealot decision we discussed. If you enjoyed module nine and module ten, and you like finding patterns and telling their story, this door is calling you.</p><p class=\"mb-3\">The cloud track is about building and running systems on rented computing power. Cloud engineers set up the servers, storage, and networks on AWS, Azure, or Google Cloud, and keep them reliable and affordable, which matters enormously in a country where uptime and cost discipline are daily battles. If you liked understanding how the cloud saves companies millions, and you enjoy making things run smoothly and cheaply, this is your track.</p><p class=\"mb-3\">The security track, often called cybersecurity, is about protecting systems and data from attackers, which in the POPIA era is a legal duty, not a nice to have. Security professionals think like both a builder and a burglar, finding the weak spots before criminals do. If the systems thinking and the find the root cause instinct excited you, security rewards exactly that mindset, and demand for it keeps climbing.</p><p class=\"mb-3\">The software track is about building the apps and websites people use, from a booking site for a studio to a banking app used by millions. Software developers turn ideas into working products, and the problem solving and decomposition from module eleven are the daily bread of this work. If you love building things you can point at and say, I made that, walk through this door.</p><p class=\"mb-3\">The AI track, the newest, is about building intelligent systems on top of all the others, the models, the agents, and the tools we spent this course exploring. It sits at the top because it draws on data, cloud, and software together, which is why so many AI engineers arrive from one of the other tracks first. You do not have to start here. Many of the best get here by mastering data or software and then climbing.</p><p class=\"mb-3\">So how do you choose. You do not have to, not perfectly, not today. Pick the track whose module lit you up the most and take one small free step, a free introductory course, a beginner project, joining a community. In South Africa look at free and affordable options, the learning platforms many of these tracks offer free introductions on, local communities, and the OfferZen blog and MyBroadband forums where people share exactly how they broke in. The salaries and specific course prices are covered separately, and they are genuinely encouraging, but chase the work that pulls you, because the person who enjoys the climb always outlasts the person chasing only the rand figure. You have the foundation now. Choose a door, take the first step, and keep the mindset you built here switched on. That mindset, not any single tool, is what will carry your whole career.</p>",
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
      "bodyHtml": "<p class=\"mb-3\">Let us clear the fog first. AI, artificial intelligence, is simply software that does tasks we used to think needed a human brain, like understanding a sentence, spotting a face, or writing a paragraph. That is it. No robot uprising, no magic. When your phone unlocks by looking at you, when Netflix guesses your next series, when your bank flags a strange purchase in Sandton while your card is in Cape Town, that is AI quietly working.</p><p class=\"mb-3\">The kind everyone is talking about in 2026 is a subtype called <strong class=\"font-semibold text-slate-900\">generative AI</strong>. Older AI sorted things and predicted things. Generative AI makes new things, a paragraph, an image, a summary, some code, on demand. The engine underneath is a <strong class=\"font-semibold text-slate-900\">large language model</strong>, or LLM, a system trained by reading an enormous amount of text until it becomes very good at predicting what words come next. Think of it like a friend who has read almost every book in the library and can now hold a conversation about any of them, quickly and patiently.</p><p class=\"mb-3\">Now the levels, because this matters. <strong class=\"font-semibold text-slate-900\">Narrow AI</strong> does one job well. Every tool you can use today is narrow AI, even the clever chat ones. <strong class=\"font-semibold text-slate-900\">Artificial general intelligence</strong>, AGI, would match a human across almost any task. It does not exist yet, no matter what a LinkedIn post tells you. <strong class=\"font-semibold text-slate-900\">Superintelligence</strong> would go beyond us. That one lives in films for now. So when someone says AI will take every job tomorrow, remember we are firmly in the narrow era, powerful but limited, a set of tools, not a colleague.</p><p class=\"mb-3\">Meet the big four you will actually touch. <strong class=\"font-semibold text-slate-900\">ChatGPT</strong>, from OpenAI, is the household name, great all rounder for writing and questions. <strong class=\"font-semibold text-slate-900\">Claude</strong>, from Anthropic, is strong at careful writing, long documents and reasoning. <strong class=\"font-semibold text-slate-900\">Gemini</strong>, from Google, plugs into Search, Gmail and Docs, and its free tier is generous. <strong class=\"font-semibold text-slate-900\">Meta AI</strong> lives right inside WhatsApp, Instagram and Facebook, which most South Africans already use daily, and it is free with no paid tier. All four have a free version good enough to learn on today, so you do not need to spend a rand to start.</p><p class=\"mb-3\">A fair caution. These tools sound confident even when they are wrong, and free tiers cap how much you can use per day. We will handle both in later modules. For now, the shift I want in your head is small but powerful, AI is not a brain that knows things, it is a tool that predicts and generates. Treat it like a very fast, very well read assistant who still needs your judgement, and you are already ahead of most people.</p>",
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
      "bodyHtml": "<p class=\"mb-3\">Most people meet AI, type three lazy words, get a bland answer, and conclude it is overhated. The truth is closer to cooking. Give a good chef a vague order, get a random plate. Tell them who it is for, what you want, and how you like it, and the meal changes completely. Prompting is just telling the tool clearly what you want.</p><p class=\"mb-3\">First, <strong class=\"font-semibold text-slate-900\">choosing a tool</strong>. For everyday writing and questions, any of the big four works. For long documents, careful reasoning or study notes, Claude shines. For anything tied to your Google world, your Gmail and Docs, Gemini is handy. For quick help without leaving your chats, Meta AI inside WhatsApp is the lowest effort option in South Africa because it is already on your phone. Do not overthink this. Pick one, learn it well, and switch only when it lets you down.</p><p class=\"mb-3\">Now the heart of it, a simple recipe I call <strong class=\"font-semibold text-slate-900\">role, task, context, format</strong>. Give the AI a role, tell it the task, hand it the context it needs, and say what format you want back. Compare these two. Weak, please write a business email. Strong, you are my assistant. Write a short, polite email to a Cape Town client, Mr Dlamini, telling him his logo design is ready and the invoice for R2 500 is attached. Keep it warm and under one hundred words. The second one gives the tool everything it needs, so it gives you something you can almost send as is.</p><p class=\"mb-3\">Three quick habits raise your results fast. <strong class=\"font-semibold text-slate-900\">Be specific</strong>, numbers, names, tone and length beat vague wishes every time. <strong class=\"font-semibold text-slate-900\">Give an example</strong> of what good looks like if you have one, even a rough one, because the tool copies patterns well. And <strong class=\"font-semibold text-slate-900\">iterate</strong>, which is the skill almost nobody uses. You do not accept the first answer and you do not start over. You simply reply, make it shorter, or too formal, loosen it up, or add a line about our load shedding backup. The tool keeps the thread and adjusts. A conversation, not a vending machine.</p><p class=\"mb-3\">One more move that feels like a cheat code. When you are not sure how to ask, ask the tool to help you ask. Type, before you answer, ask me any questions you need to give a great result. Suddenly it interviews you, and the final answer fits your situation instead of a generic one. Great prompting is not fancy words, it is clarity plus a willingness to go back and forth two or three times. Do that and you will out perform people paying for the premium plan.</p>",
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
      "bodyHtml": "<p class=\"mb-3\">Here is the single most important lesson in this whole course. AI does not know things, it predicts words that sound right. Usually right sounding and true line up. Sometimes they do not, and the tool invents a fact, a source, a statistic or a quote with total confidence. We call this a <strong class=\"font-semibold text-slate-900\">hallucination</strong>, and it is not a bug you can switch off, it is baked into how these tools work. In 2023 two lawyers were fined in a real United States court after they filed fake cases that ChatGPT had made up. They trusted, they did not check, and it cost them.</p><p class=\"mb-3\">So build one reflex, <strong class=\"font-semibold text-slate-900\">trust but verify</strong>. Use AI to draft, brainstorm and explain, then confirm anything that matters against a real source before you act. Names, dates, prices, laws, medical and financial claims, statistics, all of these get a second look. A good test, would it embarrass me or cost me money if this were wrong. If yes, check it. Cross check with a quick web search, an official site like SARS or your bank, or a person who actually knows. The tool is a brilliant first draft, never the final word.</p><p class=\"mb-3\">Now privacy, and this is where South Africans need to be sharp. When you paste something into a free AI tool, treat it like handing a note to a stranger, you do not fully control where it goes, and some tools may use your chats to improve their systems. So never paste things you would not want seen. That means no ID numbers, no bank or card details, no passwords, no medical records, no client lists, and nothing about another person that is not yours to share.</p><p class=\"mb-3\">That last point is the law, not just manners. <strong class=\"font-semibold text-slate-900\">POPIA</strong>, the Protection of Personal Information Act, is South Africa's privacy law, and it says personal information must be handled with care and a lawful reason. If you run a small business and you paste your customer database into a chatbot to write a newsletter, you may be breaking POPIA, because that is other people's personal information leaving your control. The safe habit is simple. <strong class=\"font-semibold text-slate-900\">Anonymise before you paste.</strong> Replace real names and numbers with placeholders like Client A and R2 500, get your draft, then fill the real details back in yourself. You keep the speed of AI and you keep people's trust, which for a studio owner or a job seeker is worth more than any shortcut.</p>",
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
      "bodyHtml": "<p class=\"mb-3\">Enough theory. Let us put AI to work for three South Africans you might recognise, because the point of being AI literate is a better week, not a certificate on a wall.</p><p class=\"mb-3\">First, <strong class=\"font-semibold text-slate-900\">the job seeker</strong>. Unemployment here is brutal, and a strong application is your edge. Paste a job advert and your rough experience, then ask, write me a CV tailored to this role, and a short cover letter that sounds like a real person, not a robot. Then iterate, make it fit one page, or add my volunteer work at church. Ask the tool to list likely interview questions for that job and to run a mock interview with you over chat. You can rehearse for a Shoprite management post or a junior developer role at an OfferZen company, at midnight, for free, as many times as you need. That practice used to cost money and connections. Now it costs a prompt.</p><p class=\"mb-3\">Second, <strong class=\"font-semibold text-slate-900\">the student</strong>. AI is the most patient tutor you will ever meet, and it never sighs when you ask again. Stuck on the Krebs cycle or on quadratic equations, ask it to explain like I am fifteen, then quiz me until I get it. Feed it your notes and ask for a summary, flashcards, or a study timetable that works around load shedding. One rule though, and it is the difference between learning and cheating yourself, use it to understand, not to hand in its words as yours. Ask it to teach you the method, then solve the next one on your own. Your marks and your brain both win.</p><p class=\"mb-3\">Third, <strong class=\"font-semibold text-slate-900\">the small business owner</strong>, the spaza, the salon, the studio. This is where AI feels like hiring an assistant you cannot afford yet. Draft WhatsApp promos and Instagram captions in your voice. Reply to a customer complaint calmly when you are too annoyed to. Build a simple monthly budget, a price list, or a quote for a client, just describe the job and let it structure the numbers. Write your POPIA privacy note for your booking form. Plan a week of content in ten minutes. A one person operation in Tableview can suddenly present like a small team, which is exactly the accessible premium idea, look sharp, spend little.</p><p class=\"mb-3\">The thread through all three is the same. AI removes the blank page and the boring admin, so your time goes to the parts only you can do, the sale, the relationship, the actual studying. Start with one annoying task this week and hand it over.</p>",
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
      "bodyHtml": "<p class=\"mb-3\">Well done, you made it. You can explain AI, prompt it well, catch its lies, protect your data, and put it to work. That is real literacy, and most people around you do not have it yet. Now let us turn momentum into proof and a plan.</p><p class=\"mb-3\">Start with a <strong class=\"font-semibold text-slate-900\">free certificate</strong>, because it costs nothing but your evenings and it looks good on LinkedIn and a CV. As of July 2026, a few stand out. <strong class=\"font-semibold text-slate-900\">Elements of AI</strong>, from the University of Helsinki, is free, beginner friendly, globally respected and has taught over a million people, no paywall on the certificate. <strong class=\"font-semibold text-slate-900\">Google AI Essentials</strong> on Coursera is about ten hours, needs no technical background, and carries strong brand recognition, though on Coursera you may need to use the audit or financial aid option to avoid a fee. <strong class=\"font-semibold text-slate-900\">Microsoft and LinkedIn</strong> offer short AI courses that drop a Microsoft badge straight onto your LinkedIn profile. And <strong class=\"font-semibold text-slate-900\">Kaggle Learn</strong> is completely free with certificates if you want to peek at the hands on data side. Pick one, block two evenings a week, and finish it. Sources, <a href=\"https://beginnersinai.org/free-ai-courses-with-certificates/\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-indigo-600 underline hover:text-indigo-800\">Beginners in AI, best free AI courses with certificates 2026</a> and <a href=\"https://www.coursera.org/specializations/ai-essentials-google\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-indigo-600 underline hover:text-indigo-800\">Google AI Essentials on Coursera</a>, both checked July 2026.</p><p class=\"mb-3\">Now the <strong class=\"font-semibold text-slate-900\">career map</strong>, in plain terms. The gentlest on ramp is becoming the person at your workplace who uses AI well, an <strong class=\"font-semibold text-slate-900\">AI literate professional</strong>, more productive than colleagues at the same desk, often the first noticed for growth. One step further is a <strong class=\"font-semibold text-slate-900\">prompt or AI operations</strong> type role, wiring these tools into how a business actually runs. Beyond that sit the technical roles that need study, <strong class=\"font-semibold text-slate-900\">data analyst</strong>, then <strong class=\"font-semibold text-slate-900\">data scientist</strong> and <strong class=\"font-semibold text-slate-900\">AI engineer</strong>, the path our own Brendon walked. These pay well and are in demand on South African platforms like OfferZen, but be honest, they take months of real learning, not a weekend. Treat exact salary figures as things to check live on OfferZen or MyBroadband before you bank on them, because they move.</p><p class=\"mb-3\">Which brings us to the bridge. This crash course made you confident and useful in days. The <strong class=\"font-semibold text-slate-900\">full SpaniSpace bootcamp</strong> is where confident becomes qualified, the deeper, hands on track that takes you from using AI to building with it and into those technical careers with structure, projects and support. You do not need to decide today. Finish one free certificate, keep using AI on real tasks for two weeks, and notice whether you are hungry for more. If you are, the bootcamp is your next door, and you will walk in already ahead of the room.</p>",
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
