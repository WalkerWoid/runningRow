/*
top: расстояние от верхней границы элемента до верхней границы видимой области окна браузера.
right: расстояние от правой границы элемента до левой границы видимой области окна браузера.
bottom: расстояние от нижней границы элемента до верхней границы видимой области окна браузера.
left: расстояние от левой границы элемента до левой границы видимой области окна браузера.
width: ширина элемента.
height: высота элемента.
x: горизонтальная координата верхнего левого угла элемента (то же самое, что и left).
y: вертикальная координата верхнего левого угла элемента (то же самое, что и top).
*/

class RunningRow {
    #runningRowContainer = undefined // контейнер бегущей строки
    #runningRowWrapper = undefined // контейнер враппера бегущей строки. Он нужен для того, что бы в нем хранились элементы. Что-то типа slider-row у слайдера
    #rowElements = [] // массив с элементами бегущей строки.
    #rowRect = undefined // getBoundingClientRect runningRowContainer
    #rowShift = 0 // начальное смещение бегущей строки. Она будет уменьшаться на 1.
    #currentElementId = 0 // id, по которому будут создавать и удаляться элементы
    #lastChildRect = undefined // getBoundingClientRect последнего элемента бегущей строки
    #firstChildRect = undefined // getBoundingClientRect первого элемента
    #staticRowElements = [] // статический массив всех элементов бегущей строки
    #gap = 0


    constructor(runningRowContainerSelector) {
        this.#runningRowContainer = document.querySelector(`.${runningRowContainerSelector}`)
        this.#runningRowWrapper = this.#runningRowContainer.querySelector('.runningRow-wrapper')
        this.#rowRect = this.#runningRowContainer.getBoundingClientRect()

        this.#init()
    }


    /** Инициализация бегущей строки */
    #init() {
        console.log('running row init')
        this.#initRowElements()
        this.#moveRowHandler()
        this.#gap = getComputedStyle(this.#runningRowWrapper).gap.match(/\d+/)[0]
    }


    /** Инициализация элементов бегущей строки */
    #initRowElements() {
        const widthDifference = window.innerWidth - this.#rowRect.right; // разница между шириной вьюпорта и шириной бегущей строки.
        this.#staticRowElements = [...this.#runningRowWrapper.children]
        this.#actualRow()

        while(!this.#isRowFull(widthDifference)) {
            this.#createRowElements()
            this.#actualRow()
        }
    }


    /** Метод проверяет, хватает ли элементов, что бы заполнить всю строку.
        Если right последнего элемента виден в контейнере бегущей строки, то надо будет досоздать элементы.

        window.innerWidth - widthDifference нужно на тот случай, если контейнер бегущей строки не на ширину всего
        вьюпорта. Возваращет разницу ширины между вьюпортом и родительским контейнером. */
    #isRowFull(widthDifference) {
        return this.#lastChildRect.right >= (window.innerWidth - widthDifference)
    }


    /** Актуализация всей строки: элементы массива и последний элемент */
    #actualRow() {
        this.#actualRowChild()
        this.#actualLastChild()
        this.#actualFirstChild()
        this.#actualAbsoluteChild()
    }


    /** Актуализация дочерних элементов массива. Количество элементов меняется же */
    #actualRowChild() {
        this.#rowElements = [...this.#runningRowWrapper.children]
    }


    /** Я сраный гений. Метод делает первого ребенка абсолютным позиционированием, что бы не было ебалы с хуйней, когда
     *  первый элемент удаляется и съезжает вся строка, из за чего появляются разрывы в анимации. */
    #actualAbsoluteChild() {
        const firstChild = this.#rowElements[0]
        const secondChild = this.#rowElements[1]

        firstChild.style.position = 'absolute'
        firstChild.style.width = `${secondChild.getBoundingClientRect().width}px`
        firstChild.style.height = `${this.#runningRowWrapper.getBoundingClientRect().height}px`
        firstChild.style.left = '0'
        this.#runningRowWrapper.style.paddingLeft = `${+secondChild.getBoundingClientRect().width+ +this.#gap}px`
    }


    /** Метод актуализации последнего элемента бегущей строки. */
    #actualLastChild() {
        this.#lastChildRect = this.#rowElements.at(-1).getBoundingClientRect()
    }


    /** Метод актуализации первого элемента бегущей строки. */
    #actualFirstChild() {
        this.#firstChildRect = this.#rowElements.at(0).getBoundingClientRect()
    }


    /** Актуализация id элемента, который будет создаваться*/
    #actualCurrentElementId() {
        if(this.#currentElementId === this.#staticRowElements.length-1) {
            this.#currentElementId = 0
            return
        }
        this.#currentElementId+=1
    }


    /** Метод досоздания элементов бегущей строки, если их не будет хватать. Нужно для того, что бы сделать эмуляцию
     *  бесконечной строки. Элементы потом будут создаваться и удаляться. */
    #createRowElements() {
        const newElementHtml = `
            <div class="${this.#staticRowElements[this.#currentElementId].classList}" data-id="${this.#currentElementId}">
                ${this.#staticRowElements[this.#currentElementId].innerHTML}
            </div>
        `

        this.#runningRowWrapper.insertAdjacentHTML('beforeend', newElementHtml)
        this.#actualCurrentElementId()
    }


    /** Метод удаления первого элемента */
    #deleteRowElement() {
        this.#runningRowWrapper.removeChild(this.#runningRowWrapper.firstElementChild)
        this.#rowShift = 0
    }


    /** Метод движения бегущей строки. Запускает анимацию через requestAnimationFrame*/
    #moveRowHandler() {
        this.#rowShift -= 1;
        this.#runningRowWrapper.style.transform = `translateX(${this.#rowShift}px)`;


        const widthDifference = window.innerWidth - this.#rowRect.right; // разница между шириной вьюпорта и шириной бегущей строки.
        this.#actualRow()

        if (this.#lastChildRect.right <= (window.innerWidth - widthDifference + 100)) {
            this.#createRowElements()
        }
        if (this.#firstChildRect.right === -(+this.#gap)) {
            this.#deleteRowElement()
        }
        requestAnimationFrame(this.#moveRowHandler.bind(this));
    }
}

const runningRow = new RunningRow('runningRow')
