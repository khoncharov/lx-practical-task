/* *** Model *** */

class Task {
	
    constructor(question, options, key) {
        this.question = question    		// string
        this.options = options      		// Array of strings
        this.key = this.formattedKey(key)   // string 
        this.userKey = new Set()
    }
	
	formattedKey = (value) => {
        return new Set(value.split(","))
    }
}

class Test {
	
	constructor() {
		this.tasks = []
		this.maxOptionCount = 4
	}
	
    addNewTask(question, options, key) {
        this.tasks.push(new Task(question, options, key))
    }
	
    getTasksCount() {
        return this.tasks.length
    }
	
    getQuestion(taskIndex) {
        return this.tasks[taskIndex].question
    }
	
    getOption(taskIndex, optionIndex) {
        return this.tasks[taskIndex].options[optionIndex]
    }
	
    getKey(taskIndex) {
        return this.tasks[taskIndex].key
    }
	
    getUserKey(taskIndex) {
        return this.tasks[taskIndex].userKey
    }
	
    changeUserKey(taskNum, optionNum, optionState) {
        const taskIndex = +taskNum - 1
        if (optionState) {
            this.tasks[taskIndex].userKey.add(optionNum)
        } else {
            this.tasks[taskIndex].userKey.delete(optionNum)
        }
    }
	
    isReadyToBeChecked() {
        const atLeastOneChecked = (taskIndex) => this.tasks[taskIndex].userKey.size
        for (let taskIndex = 0; taskIndex < this.getTasksCount(); taskIndex++) {
            if (!atLeastOneChecked(taskIndex)) {
                return false
            }
        }
        return true
    }
	
    checkResult() {
        const key = (taskIndex) => {
            return Array.from(this.getKey(taskIndex)).sort().join("")
        }
        const userKey = (taskIndex) => {
            return Array.from(this.getUserKey(taskIndex)).sort().join("")
        }        
        const tasksCount = this.getTasksCount()
        const questionListToLearn = []    
        for (let taskIndex = 0; taskIndex < tasksCount; taskIndex++) {
            if (key(taskIndex) !== userKey(taskIndex)) {
                questionListToLearn.push(`${taskIndex + 1}. ${this.getQuestion(taskIndex)}`)
            }
        }
        return questionListToLearn
    }
}


/* *** View *** */

class UserInterface {
	
	static createQuestionItem(taskIndex) {
		const question = document.createElement("h4")
		const questionNumber = taskIndex + 1
		question.textContent = `${questionNumber}. ${test.getQuestion(taskIndex)}`
		return question
	}

	static createOptionId(taskIndex, optionIndex) {
		// Option ID format: question N option Y => "qN-opY"
		return `q${taskIndex + 1}-op${optionIndex + 1}`
	}

	static createOptionCheckbox(taskIndex, optionIndex) {
		const checkbox = document.createElement("input")
		checkbox.type = "checkbox"
		checkbox.id = this.createOptionId(taskIndex, optionIndex)
		checkbox.addEventListener("change", function() {
			Controller.optionCheckboxChanged(this)
		})
		return checkbox
	}

	static createOptionLabel(taskIndex, optionIndex) {
		const label = document.createElement("label")
		label.htmlFor = this.createOptionId(taskIndex, optionIndex)
		label.textContent = test.getOption(taskIndex, optionIndex)
		return label
	}

	static createTask(taskIndex) {
		const container = document.createElement("div")
		container.appendChild(this.createQuestionItem(taskIndex))
		for (let optionIndex = 0; optionIndex < test.maxOptionCount; optionIndex++) {
			container.appendChild(this.createOptionCheckbox(taskIndex, optionIndex))
			container.appendChild(this.createOptionLabel(taskIndex, optionIndex))
			container.appendChild(this.createBrTag())
		}
		return container
	}

	static createTasksList() {
		const tasksList = this.createContainer("tasks-list")		
		const tasksCount = test.getTasksCount()
		for (let taskIndex = 0; taskIndex < tasksCount; taskIndex++) {
			tasksList.appendChild(this.createTask(taskIndex))
		}
		return tasksList
	}

	static createBrTag() {
		return document.createElement("br")
	}
	
	static showTest() {		
		const testContainer = document.getElementById("test-container")
		const submitButton = this.createButton("submit-button", "Отправить")
		submitButton.addEventListener("click", function() {
			Controller.showResult()
		})
		testContainer.append(
			this.createTasksList(),
			this.createBrTag(),
			submitButton
		)
	}
	
	static createContainer(id = "") {
		const container = document.createElement("div")
		container.id = id
		return container
	}
	
	static createButton(id = "", caption) {
		const button = document.createElement("button")
		button.id = id
		button.textContent = caption
		return button
	}

	static topButtonsDisabled(bool) {
		document.getElementById("add-task-button").disabled = bool
		document.getElementById("begin-test-button").disabled = bool
	}
	
	static showInitialView() {				
		const buttonContainer = this.createContainer("top-buttons")
		const addTaskButton = this.createButton("add-task-button", "Добавить вопрос")
		const beginTestButton = this.createButton("begin-test-button", "Начать тест")
		const testContainer = this.createContainer("test-container")
	
		buttonContainer.appendChild(addTaskButton)
		buttonContainer.appendChild(beginTestButton)
		document.body.prepend(testContainer)
		document.body.prepend(buttonContainer)
		
		addTaskButton.addEventListener("click", function() {
			Controller.createNewTask()
		})
		beginTestButton.addEventListener("click", function() {
			Controller.beginTest()
		})
	}
}


/* *** Controller *** */

class Controller {
	
	/* System Messages */

	static SystemMsg1() {
		return "Вы не ввели текст вопроса. Попробуйте добавить вопрос заново."
	}
	
	static SystemMsg2(optionNum) {
		return `Вы не ввели текст ${optionNum} варианта. Попробуйте добавить вопрос заново.`
	}
	
	static SystemMsg3() {
		return "Вы не ввели правильные варианты ответов. Попробуйте добавить вопрос заново."
	}
	
	static SystemMsg4() {
		return "Все вопросы должны иметь хотя бы один выбранный вариант ответа. Проверьте правильность заполнения."
	}
	
	static SystemMsg5(tasksCount, rightAnswersCount = tasksCount) {
		return `Ваш результат ${rightAnswersCount} из ${tasksCount}. Вы молодец!`
	}
	
	static SystemMsg6() {
		return "Поле может содержать только уникальные цифры 1,2,3,4 разделённые запятой. Попробуйте добавить вопрос заново."
	}
	
	static SystemMsg7(tasksCount, rightAnswersCount, questionList) {
		return `Вы неправильно ответили на вопросы:\n\n${questionList}\n\nВаш результат ${rightAnswersCount} из ${tasksCount}.`
	}
	
	/* Create new task section */

	static isValid(input) {
		return input !== null && input.trim() !== ""
	}

	static getQuestion() {
		let question = prompt("Введите текст вопроса:", "")
		if (this.isValid(question)) {
			return question.trim()
		} else {
			alert(this.SystemMsg1())
			return null
		}
	}

	static getOptions() {
		const options = []
		let option
		let optionNum
		for (let index = 0; index < test.maxOptionCount; index++) {
			optionNum = index + 1
			option = prompt(`Введите текст ${optionNum} варианта ответа`, "") 
			if (this.isValid(option)) {
				options[index] = option.trim()
			} else {
				alert(this.SystemMsg2(optionNum))
				return null
			}
		}
		return options
	}

	static isValidKey(input) {
		return input !== null && input !== ""
	}

	static getKey() {
		const key = prompt("Введите номера правильных ответов через запятую. Нумерация начинается с 1", "")
		// In the event of empty input or "Cancel"
		if (!this.isValidKey(key)) {
			alert(this.SystemMsg3())
			return null
		}
		// Pattern matching validation
		const keyPattern = /^([1-4])(?!.*\1)((,[1-4])(?!.*\3))?((,[1-4])(?!\5))?(,[1-4])?$/    
		if (key.match(keyPattern)) {    
			return key
		} else {
			alert(this.SystemMsg6())
			return null
		}
	}

	/* UI events section */

	// Create new task button
	static createNewTask() {
		const question = this.getQuestion()
		if (question === null) {
			return
		}
		const options = this.getOptions()
		if (options === null) {
			return
		}
		const key = this.getKey()
		if (key === null) {
			return
		}
		test.addNewTask(question, options, key)
	}

	// Submit button click
	static showResult() {
		if (test.isReadyToBeChecked()) {
			const tasksCount = test.getTasksCount()
			const questionListToLearn = test.checkResult()
			const wrongAnswersCount = questionListToLearn.length
			if (wrongAnswersCount === 0) {
				alert(this.SystemMsg5(tasksCount))
			} else {            
				const rightAnswersCount = tasksCount - wrongAnswersCount
				const questionsToLearn = questionListToLearn.join("\n")
				alert(this.SystemMsg7(tasksCount, rightAnswersCount, questionsToLearn))
			}
		} else {
			alert(this.SystemMsg4())
		}
	}

	// Checkbox changed
	static getTaskOptionNum(optionId) {
		// Option ID format: "qX-opY"
		const taskNum = optionId.split("-")[0].slice(1)
		const optionNum = optionId.split("-")[1].slice(2)
		return [taskNum, optionNum]
	}

	static optionCheckboxChanged(sender) {
		const [taskNum, optionNum] = this.getTaskOptionNum(sender.id)
		const optionState = sender.checked
		test.changeUserKey(taskNum, optionNum, optionState)
	}
	
	static beginTest() {
		UserInterface.topButtonsDisabled(true)
		UserInterface.showTest()
	}
}


/* *** */ 

const test = new Test()

UserInterface.showInitialView()

/* Default tasks section */

const defaultTasks = [
    {
        question: "Что из перечисленного не является языком программирования?",
        options: [
            "HTML",
            "Java",
            "Python",
            "DevOps"
        ],
        key: "1,4"
    }, {
        question: "Какие из перечисленных видов тестирования могут быть автоматизированы?",
        options: [
            "UI тестирование",
            "Юзабилити тестирование",
            "Тестирование совместимости",
            "Unit тестирование"
        ],
        key: "3,4"
    }, {
        question: "Выберите вариант, который соответствует следующему предложению: \"Известно, что "
            + "грымзик обязательно или полосат, или рогат, или и то и другое вместе.",
        options: [
            "Грымзик не может быть безрогим",
            "Грымзик не может быть однотонным и безрогим одновременно",
            "Грымзик не может быть полосатым и безрогим одновременно",
            "Грымзик не может быть однотонным и рогатым одновременно"
        ],
        key: "2"
    }, {
        question: "Выберите типы алгоритмов, которых не существует.",
        options: [
            "Алгоритм с ветвлением",
            "Циклический безусловный",
            "Циклический с параметром",
            "Алгоритм с углублением"
        ],
        key: "2,4"
    }, {
        question: "Какая (какие) из следующих конструкций используется (используются) для ветвления?",
        options: [
            "switch case",
            "if else",
            "do while",
            "for"
        ],
        key: "1,2"
    }
]

setDefaultTasks()

function setDefaultTasks() {
    const defaultTasksCount = defaultTasks.length
    for (let index = 0; index < defaultTasksCount; index++) {
        test.addNewTask(
            defaultTasks[index].question,
            defaultTasks[index].options,
            defaultTasks[index].key
        )
    }
}