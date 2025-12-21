# features/auth.feature
Feature: Auth Modal

  Scenario: Login réussi
    Given I am on "/"
    When I click "Get Started"
    And I enter "test@email.com" in "Email"
    And I enter "123456" in "Mot de passe"
    And I click "Se connecter"
    Then I should see "Dashboard"
