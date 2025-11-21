Feature: Auth Modal

  Scenario: Open the auth modal
    Given I am on "/"
    When I click "Get Started"
    Then I should see "Connexion"

  Scenario: Switch to register tab
    Given I am on "/"
    When I click "Get Started"
    And I click "Sign Up"
    Then the flip card should be flipped

  Scenario: Close modal
    Given I am on "/"
    When I click "Get Started"
    And I click "✖"
    Then I should not see "Connexion"
