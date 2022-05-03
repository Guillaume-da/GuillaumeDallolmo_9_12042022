import userEvent from '@testing-library/user-event'
 import { screen, fireEvent, getByTestId } from "@testing-library/dom"
 import { localStorageMock } from "../__mocks__/localStorage.js"
 import router from "../app/Router.js";
 import { ROUTES, ROUTES_PATH } from "../constants/routes.js"
 import NewBillUI from "../views/NewBillUI.js"
 import NewBill from "../containers/NewBill.js"
 import Store from "../app/Store"
 import mockStore from "../__mocks__/store"
 import BillsUI from "../views/BillsUI.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then NewBillForm should be displayed", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      //to-do write assertion
      expect(screen.getAllByTestId('form-new-bill')).toBeTruthy()
    })
  })
})

describe("Given I am connected as an employee and a new bill form is submited", () => {
  test('Then the handleSubmit function should be called', () => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee'
    }))
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname })
    }
    const root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.append(root)
    router()
    onNavigate(ROUTES_PATH['NewBill'])

    const bill = new NewBill({
      document, onNavigate, mockStore, localStorage: window.localStorage
    });

    const newBillForm = screen.getByTestId('form-new-bill')
    const handleSubmit = jest.fn(bill.handleSubmit);

    newBillForm.addEventListener('submit', handleSubmit)
    fireEvent.submit(newBillForm)

    expect(handleSubmit).toHaveBeenCalled()
  })
})

describe("Given I am connected as an employee, and I try to submit a PDF file", () => {
  test("Then an alert message should be displayed", () => {
    document.body.innerHTML = NewBillUI();
    jest.spyOn(Store.api, 'post').mockImplementation(mockStore.post)
    global.alert = jest.fn();
    const newBill = new NewBill({
        document, onNavigate, store: Store, localStorage: window.localStorage
    })

    const input = screen.getByTestId("file")
    const handleChangeFile = jest.fn(newBill.handleChangeFile)

    input.addEventListener("change", handleChangeFile)
    fireEvent.change(input, {
        target: {
            files: [new File(["image"], "test.pdf", {type: "image/pdf"})]
        }
    })
      
    expect(handleChangeFile).toHaveBeenCalled()
    expect(global.alert).toHaveBeenCalled()
  });
})

describe("Given I am connected as an employee, and I try to submit a JPG file", () => {
  test("Then handleChangeFile function should be called", () => {
    document.body.innerHTML = NewBillUI();
    jest.spyOn(Store.api, 'post').mockImplementation(mockStore.post)
  
    const newBill = new NewBill({
        document, onNavigate, store: Store, localStorage: window.localStorage
    });

    const input = screen.getByTestId("file");
    const handleChangeFile = jest.fn(newBill.handleChangeFile)

    input.addEventListener("change", handleChangeFile)

    fireEvent.change(input, {
        target: {
            files: [new File(["image"], "test.jpg", {type: "image/jpg"})]
        }
    });
      
    expect(handleChangeFile).toHaveBeenCalled()
    expect(input.files[0].name).toBe('test.jpg')
  });
})

// Test integration post
describe('Given I am connected as an employee, and I try to submit a new bill', () => {
  test('Then i should navigate to Bills Page, and a new bill should have been created', async () => {
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    }
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee',
      email: 'test@yes.fr'
    }))

    document.body.innerHTML = NewBillUI()
    jest.spyOn(Store.api, 'post').mockImplementation(mockStore.post)
    
    const newBill = new NewBill({ 
      document, onNavigate, store: mockStore, localStorage: window.localStorage 
    })

    const form = screen.getByTestId('form-new-bill')
    const button = form.querySelector('#btn-send-bill')
    const handleSubmit = jest.spyOn(newBill, 'handleSubmit')

    const mockedBills = mockStore.bills()
    const create = jest.spyOn(mockedBills, 'create')
    const update = jest.spyOn(mockedBills, "update")

    const mockedBillFirstStep = {
      fileName: "test.jpg"
    }

    const mockedBill = {
      "id": "47qAXb6fIm2zOKkLzMro",
      "vat": "80",
      "fileUrl": "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
      "status": "pending",
      "type": "Hôtel et logement",
      "commentary": "séminaire billed",
      "name": "encore",
      "fileName": "test.jpg",
      "date": "2004-04-04",
      "amount": 400,
      "commentAdmin": "ok",
      "email": "a@a",
      "pct": 20
    }
    
    await create(mockedBillFirstStep)
    const billUpdated = await update(mockedBill)
    const input = screen.getByTestId("file");
    const handleChangeFile = jest.fn(newBill.handleChangeFile)

    input.addEventListener("change", handleChangeFile)

    fireEvent.change(input, {
        target: {
            files: [new File(["image"], "test.jpg", {type: "image/jpg"})]
          }
      });

    form.addEventListener('submit', ((event) => newBill.handleSubmit(event)))
    userEvent.click(button)

    expect(billUpdated.id).toBe("47qAXb6fIm2zOKkLzMro")
    expect(screen.getByText('Mes notes de frais')).toBeTruthy()
    expect(handleSubmit).toHaveBeenCalled()
  })

  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
        window,
        'localStorage',
        { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "a@a"
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })

    test("fetches bills from an API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"))
          }
        }
      })
      await new Promise(process.nextTick);
      document.body.innerHTML = BillsUI({ error: 'Erreur 404'})
      const message = screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })

    test("fetches messages from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"))
          }
        }
      })
      await new Promise(process.nextTick);
      document.body.innerHTML = BillsUI({ error: 'Erreur 500'})
      const message = screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
})